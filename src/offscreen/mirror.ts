import type { LiveMirrorSignal } from '~/shared/playerBridge'
import { broadcastExtMessage } from '~/shared/chromeApi'

export class LiveStreamMirror {
  private pc: RTCPeerConnection | null = null
  private gen = 0

  constructor(private stream: MediaStream) {}

  get connected() {
    const state = this.pc?.connectionState
    const ice = this.pc?.iceConnectionState
    return state === 'connected' || state === 'connecting'
      || ice === 'connected' || ice === 'completed' || ice === 'checking'
  }

  get sendingLive() {
    return Boolean(this.pc?.getSenders().some(sender => (
      sender.track?.kind === 'video' && sender.track.readyState === 'live'
    )))
  }

  private emit(signal: LiveMirrorSignal) {
    broadcastExtMessage({
      target: 'ui',
      type: 'ENO_LIVE_MIRROR_SIGNAL',
      signal,
    })
  }

  async replaceStream(stream: MediaStream) {
    this.stream = stream
    await this.start()
  }

  async start() {
    this.close()
    const gen = ++this.gen
    const pc = new RTCPeerConnection({ iceServers: [] })
    this.pc = pc
    for (const track of this.stream.getVideoTracks()) {
      if (track.readyState === 'live')
        pc.addTrack(track, this.stream)
    }
    pc.onicecandidate = (event) => {
      if (gen !== this.gen || !event.candidate)
        return
      this.emit({ kind: 'ice', candidate: event.candidate.toJSON() })
    }
    const offer = await pc.createOffer()
    if (gen !== this.gen)
      return
    await pc.setLocalDescription(offer)
    if (gen !== this.gen)
      return
    this.emit({ kind: 'offer', sdp: offer.sdp })
  }

  async handle(signal?: LiveMirrorSignal) {
    const pc = this.pc
    if (!pc || !signal)
      return
    try {
      if (signal.kind === 'answer' && signal.sdp) {
        if (pc.signalingState !== 'have-local-offer')
          return
        await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
        return
      }
      if (signal.kind === 'ice' && signal.candidate && pc.remoteDescription)
        await pc.addIceCandidate(signal.candidate)
    }
    catch {
      // stale ICE / closed peer
    }
  }

  close() {
    this.gen += 1
    try {
      this.pc?.getSenders().forEach((sender) => {
        try {
          this.pc?.removeTrack(sender)
        }
        catch {
          // already gone
        }
      })
      this.pc?.close()
    }
    catch {
      // already closed
    }
    this.pc = null
  }
}
