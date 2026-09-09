<script setup lang="ts">
import type { LiveMirrorSignal, PlayerEnvelope } from '~/shared/playerBridge'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { offExtMessage, onExtMessage } from '~/shared/chromeApi'
import { sendPlayerMessage } from '~/shared/playerBridge'
import VideoStage from './VideoStage.vue'

const props = defineProps({
  cover: String,
  session: [String, Number],
})

const videoDom = ref<HTMLVideoElement | null>(null)
const failed = ref('')
let pc: RTCPeerConnection | null = null
let closed = false

function fitVideoBox() {
  const el = videoDom.value
  if (!el || !el.videoWidth || !el.videoHeight)
    return
  el.style.aspectRatio = `${el.videoWidth} / ${el.videoHeight}`
}

function attachStream(stream: MediaStream) {
  const el = videoDom.value
  if (!el)
    return
  el.srcObject = stream
  el.muted = true
  el.volume = 0
  el.playsInline = true
  void el.play().catch(() => {})
}

async function sendSignal(signal: LiveMirrorSignal) {
  await sendPlayerMessage({
    type: 'ENO_LIVE_MIRROR_SIGNAL',
    signal,
  })
}

async function handleSignal(signal?: LiveMirrorSignal) {
  if (!signal || closed)
    return
  if (signal.kind === 'offer' && signal.sdp) {
    pc?.close()
    const peer = new RTCPeerConnection({ iceServers: [] })
    pc = peer
    peer.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track])
      attachStream(stream)
    }
    peer.onicecandidate = (event) => {
      if (event.candidate)
        void sendSignal({ kind: 'ice', candidate: event.candidate.toJSON() })
    }
    await peer.setRemoteDescription({ type: 'offer', sdp: signal.sdp })
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    await sendSignal({ kind: 'answer', sdp: answer.sdp })
    return
  }
  if (signal.kind === 'ice' && signal.candidate && pc)
    await pc.addIceCandidate(signal.candidate)
}

function onMessage(
  message: unknown,
  _sender: unknown,
  _sendResponse: (response: unknown) => void,
) {
  const envelope = message as PlayerEnvelope
  if (envelope?.target !== 'ui' || envelope.type !== 'ENO_LIVE_MIRROR_SIGNAL')
    return false
  void handleSignal(envelope.signal)
  return false
}

async function start() {
  await nextTick()
  if (closed)
    return
  failed.value = ''
  const result = await sendPlayerMessage({ type: 'ENO_LIVE_MIRROR_START' })
  if (!result?.ok && !closed && !pc)
    failed.value = result?.error || '暂时没有直播画面'
}

function stop() {
  closed = true
  pc?.close()
  pc = null
  const el = videoDom.value
  if (el) {
    el.pause()
    el.srcObject = null
  }
  void sendPlayerMessage({ type: 'ENO_LIVE_MIRROR_STOP' }).catch(() => {})
}

onMounted(() => {
  onExtMessage(onMessage)
  void start()
  videoDom.value?.addEventListener('loadedmetadata', fitVideoBox)
})

watch(
  () => props.session,
  () => {
    if (closed)
      return
    pc?.close()
    pc = null
    const el = videoDom.value
    if (el)
      el.srcObject = null
    void start()
  },
)

onBeforeUnmount(() => {
  offExtMessage(onMessage)
  videoDom.value?.removeEventListener('loadedmetadata', fitVideoBox)
  stop()
})
</script>

<template>
  <VideoStage :cover="cover" badge="LIVE">
    <video
      ref="videoDom"
      class="video-el"
      playsinline
      muted
      autoplay
    />
    <div v-if="failed" class="video-fail">
      {{ failed }}
    </div>
  </VideoStage>
</template>

<style scoped>
.video-el {
  position: relative;
  z-index: 1;
  height: 100%;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: transparent;
}

.video-fail {
  position: absolute;
  z-index: 2;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgb(0 0 0 / 65%);
  color: #fff;
  font-size: 13px;
}
</style>
