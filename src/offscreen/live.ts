import type { OffscreenEq } from './eq'
import Hls from 'hls.js'
import { Howl, Howler } from 'howler'

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='

export class OffscreenLive {
  private video: HTMLVideoElement | null = null
  private hls: Hls | null = null
  private source: MediaElementAudioSourceNode | null = null
  private captured: MediaStream | null = null
  private startedAt = 0
  private pausedAt = 0
  private userPaused = false
  private watchTimer = 0
  private playGen = 0
  active = false
  onReload: (() => void) | null = null

  private ensureVideo() {
    if (this.video)
      return this.video
    const video = document.createElement('video')
    video.setAttribute('playsinline', 'true')
    video.muted = false
    video.autoplay = true
    video.playsInline = true
    video.disablePictureInPicture = true
    video.style.cssText = 'position:fixed;left:0;top:0;width:320px;height:180px;opacity:0.01;pointer-events:none'
    video.addEventListener('pause', this.onAutoPause)
    document.body.appendChild(video)
    this.video = video
    return video
  }

  private onAutoPause = () => {
    if (!this.active || this.userPaused || !this.video)
      return
    void this.video.play().catch(() => {})
  }

  private ensureGraph(eq: OffscreenEq, values: number[]) {
    if (!Howler.ctx) {
      const kick = new Howl({
        src: [SILENT_WAV],
        volume: 0,
        html5: false,
      })
      kick.load()
      kick.unload()
    }
    void Howler.ctx?.resume()
    eq.ensure()
    eq.update(values)
    const video = this.ensureVideo()
    if (!this.source && Howler.ctx && Howler.masterGain) {
      this.source = Howler.ctx.createMediaElementSource(video)
      this.source.connect(Howler.masterGain)
    }
  }

  elapsed() {
    if (!this.active || !this.startedAt)
      return 0
    const end = this.pausedAt || Date.now()
    return Math.max(0, (end - this.startedAt) / 1000)
  }

  setVolume(volume: number) {
    if (this.video)
      this.video.volume = Math.max(0, Math.min(1, volume))
  }

  private resetHls() {
    this.active = false
    this.startedAt = 0
    this.pausedAt = 0
    this.stopWatch()
    if (this.hls) {
      try {
        this.hls.stopLoad()
        this.hls.detachMedia()
        this.hls.destroy()
      }
      catch {
        // already destroyed
      }
      this.hls = null
    }
  }

  private startWatch() {
    this.stopWatch()
    let empty = 0
    this.watchTimer = window.setInterval(() => {
      if (!this.active || this.userPaused || !this.video)
        return
      void Howler.ctx?.resume()
      const video = this.video
      if (video.paused)
        void video.play().catch(() => {})
      if (video.readyState < 2) {
        empty += 1
        if (empty === 20)
          this.hls?.startLoad()
        if (empty === 40)
          this.onReload?.()
      }
      else {
        empty = 0
      }
    }, 500)
  }

  private stopWatch() {
    if (this.watchTimer) {
      window.clearInterval(this.watchTimer)
      this.watchTimer = 0
    }
  }

  async play(url: string, volume: number, eq: OffscreenEq, values: number[]) {
    const gen = ++this.playGen
    this.userPaused = false
    this.resetHls()
    this.captured = null
    const video = this.ensureVideo()
    this.ensureGraph(eq, values)
    this.setVolume(volume)
    this.active = true
    this.startedAt = Date.now()
    this.pausedAt = 0

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        liveSyncDurationCount: 5,
        liveMaxLatencyDurationCount: 12,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 12,
        manifestLoadingMaxRetry: 6,
        levelLoadingMaxRetry: 6,
        fragLoadingMaxRetry: 8,
        xhrSetup(xhr) {
          xhr.withCredentials = false
        },
      })
      this.hls = hls
      await new Promise<void>((resolve, reject) => {
        let settled = false
        const fail = (error: unknown) => {
          if (settled || gen !== this.playGen)
            return
          settled = true
          this.resetHls()
          reject(error instanceof Error ? error : new Error(String(error)))
        }
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void Howler.ctx?.resume()
          void video.play().then(() => {
            if (gen !== this.playGen)
              return
            settled = true
            resolve()
          }).catch(fail)
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (gen !== this.playGen)
            return
          if (!data?.fatal)
            return
          if (!settled) {
            fail(data?.details || data?.error || '直播加载失败')
            return
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad()
            return
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            try {
              hls.recoverMediaError()
            }
            catch {
              hls.startLoad()
            }
            void video.play().catch(() => {})
            return
          }
          this.onReload?.()
        })
        hls.attachMedia(video)
        hls.loadSource(url)
      })
      if (gen === this.playGen)
        this.startWatch()
      return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      await video.play()
      if (gen === this.playGen)
        this.startWatch()
      return
    }

    this.resetHls()
    throw new Error('当前浏览器无法收听直播')
  }

  pause() {
    this.userPaused = true
    if (this.video && !this.video.paused)
      this.pausedAt = Date.now()
    this.video?.pause()
  }

  resume() {
    this.userPaused = false
    if (this.pausedAt) {
      this.startedAt += Date.now() - this.pausedAt
      this.pausedAt = 0
    }
    void Howler.ctx?.resume()
    return this.video?.play()
  }

  get paused() {
    return Boolean(this.video?.paused)
  }

  captureVideoStream() {
    const video = this.video
    if (!video || video.readyState < 2)
      return null
    const liveTracks = this.captured?.getVideoTracks().filter(track => track.readyState === 'live') || []
    if (liveTracks.length)
      return this.captured
    const capture = typeof video.captureStream === 'function' ? video.captureStream() : null
    const tracks = capture?.getVideoTracks().filter(track => track.readyState === 'live') || []
    if (!tracks.length)
      return null
    this.captured = new MediaStream(tracks)
    return this.captured
  }

  releaseCapture() {
    this.captured?.getTracks().forEach((track) => {
      try {
        track.stop()
      }
      catch {
        // already ended
      }
    })
    this.captured = null
  }

  stop() {
    this.userPaused = true
    this.resetHls()
    this.video?.pause()
  }

  dispose() {
    this.onReload = null
    this.resetHls()
    this.captured = null
    if (this.source) {
      try {
        this.source.disconnect()
      }
      catch {
        // already disconnected
      }
      this.source = null
    }
    if (this.video) {
      this.video.removeEventListener('pause', this.onAutoPause)
      this.video.pause()
      this.video.removeAttribute('src')
      this.video.load()
      this.video.remove()
      this.video = null
    }
  }
}
