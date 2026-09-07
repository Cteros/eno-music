import type { PlayerPopupState, PlayerRemoteCmd, PlayerSongPayload } from '~/shared/playerBridge'
import { Howl } from 'howler'
import { broadcastExtMessage, sendExtMessage, storageLocalGet, storageLocalSet } from '~/shared/chromeApi'
import {
  PLAYER_SNAPSHOT_KEY,
  PLAYER_STATE_KEY,
  songKey,
  stripHtml,
} from '~/shared/playerBridge'
import { collectAudioUrls } from '~/shared/resolvePlayUrl'
import { OffscreenEq } from './eq'

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
  private lastPublishAt = 0
  private loading = false
  private playToken = 0
  private eq = new OffscreenEq()
  private eqValues = [0, 0, 0, 0, 0, 0]
  private rate = 1
  private sleepUntil = 0
  private sleepAfterCurrent = false

  constructor() {
    this.bindMediaSession()
    void this.restore()
  }

  getState(): PlayerPopupState {
    const hasSong = Boolean(this.play?.id || this.play?.bvid || this.play?.title)
    return {
      id: this.play?.id,
      bvid: this.play?.bvid,
      title: stripHtml(this.play?.title) || '暂无歌曲',
      author: this.play?.author || '',
      cover: this.play?.cover || '',
      video: this.play?.video || '',
      isPlaying: this.isPlaying,
      hasSong,
      current: this.current,
      total: this.total,
      volume: this.voice,
      loopMode: this.loopMode,
      rate: this.rate,
      sleepUntil: this.sleepUntil,
      sleepAfterCurrent: this.sleepAfterCurrent,
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
    const text = String(err)
    return text === '4'
      || text.endsWith(': 4')
      || text.includes('加载失败: 4')
      || text.includes('加载失败：4')
      || text.includes('MEDIA_ERR_SRC_NOT_SUPPORTED')
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
    }
    catch (error) {
      console.warn('[offscreen] restore failed', error)
    }
    await this.publish()
  }

  private tick = () => {
    if (!this.howl)
      return
    const seek = this.howl.seek()
    this.current = typeof seek === 'number' ? seek : 0
    if (this.total <= 0)
      this.total = this.howl.duration() || 0
    if (this.maybeSleep())
      return
    void this.publish(true)
    if (!this.howl.playing())
      this.stopTick()
  }

  private startTick() {
    this.stopTick()
    this.tick()
    this.tickTimer = window.setInterval(this.tick, 250)
  }

  private stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = 0
    }
  }

  private unload() {
    this.stopTick()
    if (this.howl) {
      this.howl.stop()
      this.howl.unload()
      this.howl = null
    }
    this.isPlaying = false
  }

  private isIgnorableLoadError(err: unknown) {
    return String(err).includes('No codec support')
  }

  private waitForHowl(howl: Howl, event: 'play' | 'pause', timeout = 6000) {
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

      const timer = window.setTimeout(resolve, timeout)
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

  private async loadAndPlay(song: PlayerSongPayload) {
    const token = ++this.playToken
    this.loading = true
    this.lastError = ''
    const tried: string[] = []
    let working: PlayerSongPayload = { ...song }
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
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

        const url = urls[0]
        tried.push(url)
        this.play = { ...resolved, url }
        const index = this.playList.findIndex(item => songKey(item) === songKey(resolved))
        if (index >= 0) {
          if (index !== this.history.at(-1))
            this.history.push(index)
        }
        else {
          this.playList.push(this.play)
          this.history.push(this.playList.length - 1)
        }

        this.persistSnapshot()
        this.unload()
        this.current = 0
        this.total = 0
        await this.publish()

        const howl = new Howl({
          src: [url],
          html5: true,
          format: ['m4a', 'mp4', 'aac'],
          volume: this.voice,
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
        this.howl = howl
        howl.rate(this.rate)
        howl.play()
        try {
          await this.waitForHowl(howl, 'play')
        }
        catch (error) {
          if (!this.isRetryableLoadError(error) || token !== this.playToken)
            throw error
          this.unload()
          working = {
            ...resolved,
            url: undefined,
            skipUrls: tried,
          }
          continue
        }
        if (token !== this.playToken)
          return this.getState()
        this.isPlaying = howl.playing()
        this.total = howl.duration() || this.total
        if (this.isPlaying) {
          this.lastError = ''
          await this.publish()
          return this.getState()
        }
        working = {
          ...resolved,
          url: undefined,
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
    if (Array.isArray(playList) && playList.length)
      this.playList = playList
    if (loopMode)
      this.loopMode = loopMode
    return this.loadAndPlay(song)
  }

  setPlayList(playList: PlayerSongPayload[] = []) {
    this.playList = playList
    this.persistSnapshot()
    return this.publish()
  }

  setLoopMode(loopMode: string) {
    this.loopMode = loopMode || 'list'
    this.persistSnapshot()
    return this.publish()
  }

  setVolume(volume: number) {
    this.voice = Math.max(0, Math.min(1, Number(volume) || 0))
    this.howl?.volume(this.voice)
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
    if (this.howl?.playing()) {
      this.howl.pause()
      this.isPlaying = false
      this.stopTick()
    }
    void this.publish()
    return true
  }

  seekRatio(ratio: number) {
    if (!this.howl || !this.total)
      return this.publish()
    const next = Math.max(0, Math.min(1, ratio)) * this.total
    this.howl.seek(next)
    this.current = next
    return this.publish()
  }

  seekTo(seconds: number) {
    if (!this.howl)
      return this.publish()
    const next = Math.max(0, seconds)
    this.howl.seek(next)
    this.current = next
    return this.publish()
  }

  async change(type: 'prev' | 'next') {
    if (!this.playList.length)
      return this.getState()

    let index = this.history.at(-1) || 0
    if (this.loopMode === 'random') {
      if (type === 'next') {
        index = Math.floor(Math.random() * this.playList.length)
      }
      else {
        const remove = this.history.splice(-2)
        index = remove[0] || 0
      }
    }
    else {
      const len = this.playList.length
      index = type === 'next'
        ? (index + 1) % len
        : (index - 1 + len) % len
    }

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
      if (!this.play?.id && !this.play?.bvid) {
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

    if (!this.howl) {
      if (this.play?.id || this.play?.bvid)
        return this.loadAndPlay(this.play)
      this.lastError = '还没有歌曲，先在完整页点一首'
      return this.publish()
    }

    const howl = this.howl
    const shouldPlay = cmd === 'play' || (cmd === 'toggle' && !this.isPlaying)

    if (cmd === 'pause' || !shouldPlay) {
      howl.pause()
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
