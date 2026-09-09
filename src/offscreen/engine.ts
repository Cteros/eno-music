import type { PlayerPopupState, PlayerRemoteCmd, PlayerSongPayload } from '~/shared/playerBridge'
import { Howl } from 'howler'
import { broadcastExtMessage, sendExtMessage, storageLocalGet, storageLocalSet } from '~/shared/chromeApi'
import { CROSSFADE_MS, crossfadeDurationMs, shouldOverlapBeforeEnd, shouldPrimeNext } from '~/shared/crossfade'
import { isLiveTrack } from '~/shared/liveRoom'
import { isRetryableLoadError as isRetryableMediaError } from '~/shared/mediaError'
import {
  findTrackIndex,
  PLAYER_SNAPSHOT_KEY,
  PLAYER_STATE_KEY,
  songKey,
  stripHtml,
} from '~/shared/playerBridge'
import { collectAudioUrls } from '~/shared/resolvePlayUrl'
import { wait } from '~/shared/retry'
import { OffscreenEq } from './eq'
import { OffscreenLive } from './live'
import { LiveStreamMirror } from './mirror'

export class OffscreenAudioEngine {
  private howl: Howl | null = null
  private play: PlayerSongPayload = {}
  private playList: PlayerSongPayload[] = []
  private loopMode = 'list'
  private voice = 1
  private history: number[] = []
  private isPlaying = false
  private current = 0
  private total = 0
  private lastError = ''
  private tickTimer = 0
  private vizTimer = 0
  private lastPublishAt = 0
  private loading = false
  private playToken = 0
  private eq = new OffscreenEq()
  private eqValues = [0, 0, 0, 0, 0, 0]
  private rate = 1
  private sleepUntil = 0
  private sleepAfterCurrent = false
  private crossfade = true
  private outgoing: Howl | null = null
  private fadeTimer = 0
  private overlapLock = false
  private primed: PlayerSongPayload | null = null
  private primedIndex: number | null = null
  private live = new OffscreenLive()
  private liveMirror: LiveStreamMirror | null = null
  private blobByHowl = new Map<Howl, string>()

  constructor() {
    this.bindMediaSession()
    this.live.onReload = () => {
      void this.reloadLive()
    }
    void this.restore()
  }

  getState(): PlayerPopupState {
    const hasSong = Boolean(this.play?.id || this.play?.bvid || this.play?.title)
    return {
      id: this.play?.id,
      bvid: this.play?.bvid,
      cid: this.play?.cid,
      title: stripHtml(this.play?.title) || '暂无歌曲',
      author: this.play?.author || '',
      cover: this.play?.cover || '',
      video: isLiveTrack(this.play)
        ? (this.play?.url || this.play?.video || '')
        : (this.play?.video || ''),
      isPlaying: this.isPlaying,
      hasSong,
      current: this.current,
      total: this.total,
      volume: this.voice,
      loopMode: this.loopMode,
      rate: this.rate,
      sleepUntil: this.sleepUntil,
      sleepAfterCurrent: this.sleepAfterCurrent,
      crossfade: this.crossfade,
      live: isLiveTrack(this.play),
      error: this.lastError || undefined,
      updatedAt: Date.now(),
    }
  }

  async publish(force = true) {
    const now = Date.now()
    if (!force && now - this.lastPublishAt < 250)
      return this.getState()
    this.lastPublishAt = now
    const state = this.getState()
    try {
      await storageLocalSet({ [PLAYER_STATE_KEY]: state })
    }
    catch (error) {
      console.warn('[offscreen] publish failed', error)
    }
    broadcastExtMessage({
      target: 'ui',
      type: 'ENO_PLAYER_STATE',
      state,
    })
    this.updateMediaSession()
    return state
  }

  private bindMediaSession() {
    if (!('mediaSession' in navigator))
      return
    const session = navigator.mediaSession
    session.setActionHandler('play', () => {
      void this.handleCmd('play')
    })
    session.setActionHandler('pause', () => {
      void this.handleCmd('pause')
    })
    session.setActionHandler('previoustrack', () => {
      void this.change('prev')
    })
    session.setActionHandler('nexttrack', () => {
      void this.change('next')
    })
    session.setActionHandler('seekbackward', () => {
      void this.seekTo(Math.max(0, this.current - 10))
    })
    session.setActionHandler('seekforward', () => {
      void this.seekTo(this.current + 10)
    })
    session.setActionHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number')
        void this.seekTo(details.seekTime)
    })
  }

  private updateMediaSession() {
    if (!('mediaSession' in navigator))
      return
    const session = navigator.mediaSession
    session.playbackState = this.isPlaying ? 'playing' : 'paused'
    const title = stripHtml(this.play?.title) || 'ENO-M'
    session.metadata = new MediaMetadata({
      title,
      artist: this.play?.author || '',
      artwork: this.play?.cover
        ? [{ src: this.play.cover, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    })
    if (this.total > 0) {
      try {
        session.setPositionState({
          duration: this.total,
          playbackRate: this.rate || 1,
          position: Math.min(Math.max(0, this.current), this.total),
        })
      }
      catch {
        // some browsers throw when duration/position is not finite
      }
    }
  }

  private persistSnapshot() {
    void storageLocalSet({
      [PLAYER_SNAPSHOT_KEY]: {
        play: this.play,
        playList: this.playList,
        loopMode: this.loopMode,
        voice: this.voice,
        eqValues: this.eqValues,
        rate: this.rate,
        sleepUntil: this.sleepUntil,
        sleepAfterCurrent: this.sleepAfterCurrent,
        crossfade: this.crossfade,
      },
    }).catch((error) => {
      console.warn('[offscreen] persist failed', error)
    })
  }

  private async ensureUrl(song: PlayerSongPayload) {
    const skip = Array.isArray(song.skipUrls) ? song.skipUrls as string[] : []
    if (song?.url && !skip.includes(song.url))
      return song
    const result = await sendExtMessage({
      target: 'background',
      type: 'ENO_RESOLVE_URL',
      song: {
        ...song,
        url: skip.includes(String(song.url || '')) ? undefined : song.url,
      },
    })
    if (!result?.ok || !result?.song?.url)
      throw new Error(result?.error || '解析音轨失败')
    return result.song as PlayerSongPayload
  }

  private collectSongUrls(song: PlayerSongPayload, skip: string[] = []) {
    const skipSet = new Set(skip)
    const urls: string[] = []
    const push = (url?: string) => {
      if (url && !skipSet.has(url) && !urls.includes(url))
        urls.push(url)
    }
    push(song.url)
    for (const url of collectAudioUrls(song.dash))
      push(url)
    if (Array.isArray(song.cdns)) {
      for (const url of song.cdns)
        push(typeof url === 'string' ? url : '')
    }
    return urls
  }

  private isRetryableLoadError(err: unknown) {
    return isRetryableMediaError(err)
  }

  private async restore() {
    try {
      const data = await storageLocalGet(PLAYER_SNAPSHOT_KEY)
      const snap = data[PLAYER_SNAPSHOT_KEY] as {
        play?: PlayerSongPayload
        playList?: PlayerSongPayload[]
        loopMode?: string
        voice?: number
        eqValues?: number[]
        rate?: number
        sleepUntil?: number
        sleepAfterCurrent?: boolean
        crossfade?: boolean
      } | undefined
      if (snap?.play)
        this.play = snap.play
      if (Array.isArray(snap?.playList))
        this.playList = snap.playList
      if (snap?.loopMode)
        this.loopMode = snap.loopMode
      if (typeof snap?.voice === 'number')
        this.voice = snap.voice
      if (Array.isArray(snap?.eqValues))
        this.eqValues = snap.eqValues
      if (typeof snap?.rate === 'number' && snap.rate > 0)
        this.rate = snap.rate
      if (typeof snap?.sleepUntil === 'number')
        this.sleepUntil = snap.sleepUntil
      this.sleepAfterCurrent = Boolean(snap?.sleepAfterCurrent)
      if (typeof snap?.crossfade === 'boolean')
        this.crossfade = snap.crossfade
    }
    catch (error) {
      console.warn('[offscreen] restore failed', error)
    }
    await this.publish()
  }

  private tick = () => {
    if (this.live.active) {
      this.current = this.live.elapsed()
      this.total = 0
      if (this.maybeSleep())
        return
      void this.publish(true)
      return
    }
    if (!this.howl)
      return
    const seek = this.howl.seek()
    this.current = typeof seek === 'number' ? seek : 0
    if (this.total <= 0)
      this.total = this.howl.duration() || 0
    if (this.maybeSleep())
      return
    const overlap = {
      enabled: this.crossfade,
      playing: this.howl.playing(),
      loopMode: this.loopMode,
      sleepAfterCurrent: this.sleepAfterCurrent,
      locked: this.overlapLock || this.loading,
      hasNext: this.playList.length > 1,
      current: this.current,
      total: this.total,
    }
    if (shouldOverlapBeforeEnd(overlap))
      void this.armOverlap()
    else if (shouldPrimeNext({ ...overlap, primed: Boolean(this.primed) }))
      void this.primeNext()
    void this.publish(true)
    if (!this.howl.playing())
      this.stopTick()
  }

  private startTick() {
    this.stopTick()
    this.tick()
    this.tickTimer = window.setInterval(this.tick, 250)
    this.startViz()
  }

  private stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = 0
    }
    this.stopViz()
  }

  private startViz() {
    this.stopViz(false)
    this.publishViz()
    this.vizTimer = window.setInterval(() => this.publishViz(), 80)
  }

  private stopViz(zero = true) {
    if (this.vizTimer) {
      clearInterval(this.vizTimer)
      this.vizTimer = 0
    }
    if (zero)
      this.publishViz(true)
  }

  private publishViz(silent = false) {
    const viz = silent ? { bass: 0, mid: 0, high: 0 } : this.eq.sample()
    broadcastExtMessage({
      target: 'ui',
      type: 'ENO_VIZ',
      viz,
    })
  }

  private releaseHowl(howl: Howl | null) {
    if (!howl)
      return
    const blob = this.blobByHowl.get(howl)
    if (blob) {
      this.blobByHowl.delete(howl)
      URL.revokeObjectURL(blob)
    }
    try {
      howl.stop()
      howl.unload()
    }
    catch {
      // already torn down
    }
  }

  private async materializeAudioUrl(url: string) {
    const response = await fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
    })
    if (!response.ok)
      throw new Error(`音轨下载失败 ${response.status}`)
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength < 64)
      throw new Error('音轨下载失败')
    const type = response.headers.get('content-type') || ''
    const blob = new Blob([buffer], {
      type: type.includes('audio') || type.includes('mp4') ? type.split(';')[0] : 'audio/mp4',
    })
    return URL.createObjectURL(blob)
  }

  private finishOutgoing() {
    if (this.fadeTimer) {
      window.clearTimeout(this.fadeTimer)
      this.fadeTimer = 0
    }
    const howl = this.outgoing
    this.outgoing = null
    this.overlapLock = false
    this.releaseHowl(howl)
  }

  private startFade(from: Howl, to: Howl, ms: number) {
    if (this.outgoing && this.outgoing !== from)
      this.releaseHowl(this.outgoing)
    this.outgoing = from
    this.overlapLock = true
    const fromVol = typeof from.volume() === 'number' ? from.volume() as number : this.voice
    from.fade(fromVol, 0, ms)
    to.volume(0)
    to.fade(0, this.voice, ms)
    from.once('fade', () => {
      if (this.outgoing === from)
        this.finishOutgoing()
    })
    this.fadeTimer = window.setTimeout(() => {
      if (this.outgoing === from)
        this.finishOutgoing()
    }, ms + 160)
  }

  private unload() {
    this.stopTick()
    this.finishOutgoing()
    this.live.stop()
    this.releaseHowl(this.howl)
    this.howl = null
    this.isPlaying = false
  }

  private isIgnorableLoadError(err: unknown) {
    return String(err).includes('No codec support')
  }

  private waitForHowl(howl: Howl, event: 'play' | 'pause', timeout = 12000) {
    return new Promise<void>((resolve, reject) => {
      if (event === 'play' && howl.playing()) {
        this.isPlaying = true
        resolve()
        return
      }
      if (event === 'pause' && !howl.playing()) {
        this.isPlaying = false
        resolve()
        return
      }

      const timer = window.setTimeout(() => {
        reject(new Error(event === 'play' ? '加载超时' : '暂停超时'))
      }, timeout)
      const done = () => {
        window.clearTimeout(timer)
        resolve()
      }
      const fail = (label: string) => (_id: number, err: unknown) => {
        window.clearTimeout(timer)
        reject(new Error(`${label}: ${err}`))
      }

      howl.once(event, done)
      if (event === 'play') {
        howl.once('playerror', fail('播放失败'))
        howl.once('loaderror', (_id, err) => {
          if (this.isIgnorableLoadError(err))
            return
          fail('加载失败')(_id, err)
        })
      }
    })
  }

  private createTrackHowl(url: string, volume: number) {
    const howl = new Howl({
      src: [url],
      html5: true,
      format: ['m4a', 'mp4', 'aac'],
      volume,
      rate: this.rate,
      onplay: () => {
        if (this.howl !== howl)
          return
        this.isPlaying = true
        this.lastError = ''
        this.total = howl.duration() || 0
        howl.rate(this.rate)
        this.eq.update(this.eqValues)
        this.startTick()
        void this.publish()
      },
      onpause: () => {
        if (this.howl !== howl)
          return
        this.isPlaying = false
        this.stopTick()
        void this.publish()
      },
      onstop: () => {
        if (this.howl !== howl)
          return
        this.isPlaying = false
        this.stopTick()
        void this.publish()
      },
      onend: () => {
        if (this.howl !== howl)
          return
        if (this.sleepAfterCurrent) {
          this.clearSleep()
          this.isPlaying = false
          this.stopTick()
          void this.publish()
          return
        }
        if (this.overlapLock || this.loading)
          return
        if (this.loopMode === 'single')
          void this.loadAndPlay(this.play)
        else
          void this.change('next')
      },
      onloaderror: (_id, err) => {
        if (this.howl !== howl)
          return
        if (this.isIgnorableLoadError(err) || howl.playing())
          return
        this.lastError = `加载失败：${err}`
        this.isPlaying = false
        void this.publish()
      },
      onplayerror: (_id, err) => {
        if (this.howl !== howl)
          return
        this.lastError = `播放失败：${err}`
        this.isPlaying = false
        void this.publish()
      },
    })
    return howl
  }

  private async playResolvedUrl(
    url: string,
    token: number,
    volume: number,
  ) {
    let howl = this.createTrackHowl(url, volume)
    this.howl = howl
    howl.rate(this.rate)
    howl.play()
    try {
      await this.waitForHowl(howl, 'play')
      return howl
    }
    catch (error) {
      if (!this.isRetryableLoadError(error) || token !== this.playToken)
        throw error
      this.releaseHowl(howl)
      const blobUrl = await this.materializeAudioUrl(url)
      if (token !== this.playToken) {
        URL.revokeObjectURL(blobUrl)
        throw error
      }
      howl = this.createTrackHowl(blobUrl, volume)
      this.blobByHowl.set(howl, blobUrl)
      this.howl = howl
      howl.rate(this.rate)
      howl.play()
      try {
        await this.waitForHowl(howl, 'play')
        return howl
      }
      catch (blobError) {
        this.releaseHowl(howl)
        throw blobError
      }
    }
  }

  private async loadAndPlayLive(song: PlayerSongPayload) {
    const token = ++this.playToken
    this.loading = true
    this.lastError = ''
    this.unload()
    try {
      const resolved = (await this.ensureUrl({ ...song, url: undefined })) as PlayerSongPayload
      if (token !== this.playToken)
        return this.getState()
      if (!resolved.url)
        throw new Error('直播地址为空')
      this.play = { ...resolved }
      const index = findTrackIndex(this.playList, resolved)
      if (index >= 0) {
        if (index !== this.history.at(-1))
          this.history.push(index)
      }
      else {
        this.playList.push(this.play)
        this.history.push(this.playList.length - 1)
      }
      this.persistSnapshot()
      await this.live.play(resolved.url, this.voice, this.eq, this.eqValues)
      if (token !== this.playToken) {
        this.live.stop()
        return this.getState()
      }
      this.isPlaying = true
      this.current = 0
      this.total = 0
      this.startTick()
      if (this.liveMirror)
        await this.startLiveMirror().catch(() => {})
      await this.publish()
      return this.getState()
    }
    catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      this.isPlaying = false
      this.live.stop()
      await this.publish()
      throw error
    }
    finally {
      if (token === this.playToken)
        this.loading = false
    }
  }

  private async loadAndPlay(song: PlayerSongPayload) {
    if (isLiveTrack(song))
      return this.loadAndPlayLive(song)
    this.live.stop()
    const token = ++this.playToken
    this.loading = true
    this.lastError = ''
    const previous = this.howl
    const previousKey = songKey(this.play)
    const tried: string[] = []
    let working: PlayerSongPayload = { ...song }
    if (this.primed && songKey(this.primed) === songKey(song)) {
      working = { ...this.primed }
      this.primed = null
    }
    try {
      for (let round = 0; round < 3; round++) {
        if (token !== this.playToken)
          return this.getState()

        const resolved = (await this.ensureUrl(working)) as PlayerSongPayload
        if (token !== this.playToken)
          return this.getState()

        const urls = this.collectSongUrls(resolved, tried)
        if (!urls.length) {
          working = {
            ...resolved,
            url: undefined,
            dash: undefined,
            skipUrls: tried,
          }
          continue
        }

        const remainingMs = previous && this.total > 0
          ? Math.max(0, (this.total - this.current) * 1000)
          : CROSSFADE_MS
        const fadeMs = crossfadeDurationMs({
          enabled: this.crossfade,
          hasOutgoing: Boolean(previous),
          outgoingPlaying: Boolean(previous?.playing()),
          sameTrack: songKey(resolved) === previousKey,
          volume: this.voice,
          remainingMs,
        })
        let outgoing = previous

        this.persistSnapshot()
        if (!fadeMs && outgoing) {
          this.stopTick()
          this.releaseHowl(outgoing)
          if (this.howl === outgoing)
            this.howl = null
          outgoing = null
        }
        this.current = fadeMs ? this.current : 0
        if (!fadeMs)
          this.total = 0

        for (const url of urls) {
          if (token !== this.playToken)
            return this.getState()
          tried.push(url)
          this.play = { ...resolved, url }
          const index = findTrackIndex(this.playList, resolved)
          if (index >= 0) {
            if (index !== this.history.at(-1))
              this.history.push(index)
          }
          else {
            this.playList.push(this.play)
            this.history.push(this.playList.length - 1)
          }
          await this.publish()

          let howl: Howl
          try {
            howl = await this.playResolvedUrl(url, token, fadeMs ? 0 : this.voice)
          }
          catch (error) {
            if (!this.isRetryableLoadError(error) || token !== this.playToken)
              throw error
            if (this.howl && this.howl !== previous)
              this.releaseHowl(this.howl)
            this.howl = previous
            continue
          }
          if (token !== this.playToken) {
            if (this.howl !== howl)
              this.releaseHowl(howl)
            return this.getState()
          }
          if (fadeMs && outgoing && outgoing !== howl)
            this.startFade(outgoing, howl, fadeMs)
          else if (outgoing && outgoing !== howl)
            this.releaseHowl(outgoing)
          this.isPlaying = howl.playing()
          this.total = howl.duration() || this.total
          this.current = 0
          if (this.isPlaying) {
            this.lastError = ''
            await this.publish()
            return this.getState()
          }
          this.releaseHowl(howl)
          if (this.howl === howl)
            this.howl = previous
        }

        working = {
          ...resolved,
          url: undefined,
          dash: undefined,
          skipUrls: tried,
        }
      }

      throw new Error(this.lastError || '没有可用音轨，可能需要登录')
    }
    catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      this.isPlaying = false
      await this.publish()
      throw error
    }
    finally {
      if (token === this.playToken)
        this.loading = false
    }
  }

  async playSong(song: PlayerSongPayload, playList?: PlayerSongPayload[], loopMode?: string) {
    this.primed = null
    this.primedIndex = null
    if (Array.isArray(playList) && playList.length) {
      this.replacePlayList(playList)
    }
    if (loopMode)
      this.loopMode = loopMode
    return this.loadAndPlay(song)
  }

  setPlayList(playList: PlayerSongPayload[] = []) {
    this.replacePlayList(playList)
    this.persistSnapshot()
    return this.publish()
  }

  private replacePlayList(playList: PlayerSongPayload[]) {
    const same = playList.length === this.playList.length
      && playList.every((item, index) => songKey(item) === songKey(this.playList[index]))
    this.playList = playList
    if (!same)
      this.history = []
  }

  setLoopMode(loopMode: string) {
    this.loopMode = loopMode || 'list'
    this.persistSnapshot()
    return this.publish()
  }

  setVolume(volume: number) {
    this.voice = Math.max(0, Math.min(1, Number(volume) || 0))
    this.howl?.volume(this.voice)
    this.live.setVolume(this.voice)
    this.persistSnapshot()
    return this.publish()
  }

  setEq(values: number[] = []) {
    this.eqValues = values
    this.eq.update(values)
    this.persistSnapshot()
    return this.publish()
  }

  setRate(rate: number) {
    const next = Number(rate)
    this.rate = Number.isFinite(next) && next > 0 ? Math.min(2, Math.max(0.5, next)) : 1
    this.howl?.rate(this.rate)
    this.persistSnapshot()
    return this.publish()
  }

  setSleep(minutes = 0, afterCurrent = false) {
    if (afterCurrent) {
      this.sleepAfterCurrent = true
      this.sleepUntil = 0
    }
    else if (minutes > 0) {
      this.sleepAfterCurrent = false
      this.sleepUntil = Date.now() + minutes * 60 * 1000
    }
    else {
      this.clearSleep(false)
    }
    this.persistSnapshot()
    return this.publish()
  }

  setCrossfade(enabled: boolean) {
    this.crossfade = Boolean(enabled)
    this.persistSnapshot()
    return this.publish()
  }

  private mirrorToken = 0

  private liveReloadAt = 0

  private async reloadLive() {
    if (!isLiveTrack(this.play) || this.loading || !this.live.active)
      return
    if (Date.now() - this.liveReloadAt < 15000)
      return
    this.liveReloadAt = Date.now()
    try {
      const resolved = (await this.ensureUrl({ ...this.play, url: undefined })) as PlayerSongPayload
      if (!resolved.url)
        return
      this.play = { ...resolved }
      await this.live.play(resolved.url, this.voice, this.eq, this.eqValues)
      this.isPlaying = true
      this.startTick()
      if (this.liveMirror)
        await this.startLiveMirror().catch(() => {})
      await this.publish()
    }
    catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      this.isPlaying = false
      await this.publish()
    }
  }

  async startLiveMirror() {
    const token = ++this.mirrorToken
    for (let i = 0; i < 50; i++) {
      if (token !== this.mirrorToken)
        return this.getState()
      const stream = this.live.captureVideoStream()
      if (stream) {
        if (this.liveMirror) {
          await this.liveMirror.replaceStream(stream)
        }
        else {
          this.liveMirror = new LiveStreamMirror(stream)
          await this.liveMirror.start()
        }
        if (token !== this.mirrorToken)
          return this.getState()
        return this.getState()
      }
      await wait(100)
    }
    throw new Error('暂时没有直播画面')
  }

  async handleLiveMirrorSignal(signal?: { kind: 'offer' | 'answer' | 'ice', sdp?: string, candidate?: RTCIceCandidateInit | null }) {
    await this.liveMirror?.handle(signal)
    return this.getState()
  }

  stopLiveMirror() {
    this.mirrorToken += 1
    this.liveMirror?.close()
    this.liveMirror = null
    this.live.releaseCapture()
    return this.getState()
  }

  async setLivePicture(_on: boolean) {
    return this.getState()
  }

  private clearSleep(persist = true) {
    this.sleepUntil = 0
    this.sleepAfterCurrent = false
    if (persist)
      this.persistSnapshot()
  }

  private maybeSleep() {
    if (!this.sleepUntil || Date.now() < this.sleepUntil)
      return false
    this.clearSleep()
    if (this.live.active) {
      this.live.pause()
      this.isPlaying = false
      this.stopTick()
      void this.publish()
      return true
    }
    if (this.howl?.playing()) {
      this.howl.pause()
      this.isPlaying = false
      this.stopTick()
    }
    void this.publish()
    return true
  }

  seekRatio(ratio: number) {
    if (isLiveTrack(this.play) || !this.howl || !this.total)
      return this.publish()
    const next = Math.max(0, Math.min(1, ratio)) * this.total
    this.howl.seek(next)
    this.current = next
    return this.publish()
  }

  seekTo(seconds: number) {
    if (isLiveTrack(this.play) || !this.howl)
      return this.publish()
    const next = Math.max(0, seconds)
    this.howl.seek(next)
    this.current = next
    return this.publish()
  }

  private neighborIndex(type: 'prev' | 'next') {
    const len = this.playList.length
    if (!len)
      return -1
    if (type === 'next' && this.primedIndex != null && this.primedIndex >= 0 && this.primedIndex < len)
      return this.primedIndex

    let index = findTrackIndex(this.playList, this.play)
    if (index < 0)
      index = this.history.at(-1) ?? 0
    index = Math.max(0, Math.min(index, len - 1))

    if (this.loopMode === 'random') {
      if (type === 'next') {
        index = Math.floor(Math.random() * len)
      }
      else {
        const remove = this.history.splice(-2)
        index = Math.max(0, Math.min(remove[0] || 0, len - 1))
      }
    }
    else {
      index = type === 'next'
        ? (index + 1) % len
        : (index - 1 + len) % len
    }
    return index
  }

  private async primeNext() {
    const index = this.neighborIndex('next')
    const song = this.playList[index]
    if (!song || songKey(song) === songKey(this.play))
      return
    this.primedIndex = index
    try {
      this.primed = await this.ensureUrl({ ...song }) as PlayerSongPayload
    }
    catch {
      this.primed = null
    }
  }

  private async armOverlap() {
    if (this.overlapLock || this.loading)
      return
    this.overlapLock = true
    try {
      await this.change('next')
    }
    finally {
      if (!this.outgoing)
        this.overlapLock = false
    }
  }

  async change(type: 'prev' | 'next') {
    if (!this.playList.length)
      return this.getState()

    const index = this.neighborIndex(type)
    this.primedIndex = null
    this.primed = type === 'next' ? this.primed : null
    if (index < 0)
      return this.getState()

    this.history.push(index)
    const song = this.playList[index]
    if (song)
      await this.loadAndPlay(song)
    return this.getState()
  }

  async handleCmd(cmd: PlayerRemoteCmd) {
    if (cmd === 'prev' || cmd === 'next')
      return this.change(cmd)

    if (cmd === 'retry') {
      if (!this.play?.id && !this.play?.bvid && !isLiveTrack(this.play)) {
        this.lastError = '还没有歌曲，先在完整页点一首'
        return this.publish()
      }
      return this.loadAndPlay({
        ...this.play,
        url: undefined,
        dash: undefined,
        skipUrls: [],
      })
    }

    if (this.live.active) {
      const shouldPlay = cmd === 'play' || (cmd === 'toggle' && !this.isPlaying)
      if (cmd === 'pause' || !shouldPlay) {
        this.live.pause()
        this.isPlaying = false
        this.stopTick()
        return this.publish()
      }
      await this.live.resume()
      this.isPlaying = true
      this.startTick()
      return this.publish()
    }

    if (!this.howl) {
      if (this.play?.id || this.play?.bvid || isLiveTrack(this.play))
        return this.loadAndPlay(this.play)
      this.lastError = '还没有歌曲，先在完整页点一首'
      return this.publish()
    }

    const howl = this.howl
    const shouldPlay = cmd === 'play' || (cmd === 'toggle' && !this.isPlaying)

    if (cmd === 'pause' || !shouldPlay) {
      howl.pause()
      this.outgoing?.pause()
      this.isPlaying = false
      this.stopTick()
      return this.publish()
    }

    if (!this.isPlaying)
      howl.play()
    await this.waitForHowl(howl, 'play')
    this.isPlaying = howl.playing()
    return this.publish()
  }
}

export const engine = new OffscreenAudioEngine()
