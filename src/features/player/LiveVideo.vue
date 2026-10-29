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
let connectTimer = 0

function fitVideoBox() {
  const el = videoDom.value
  if (!el || !el.videoWidth || !el.videoHeight)
    return
  el.style.aspectRatio = `${el.videoWidth} / ${el.videoHeight}`
}

function clearConnectTimer() {
  if (connectTimer) {
    window.clearTimeout(connectTimer)
    connectTimer = 0
  }
}

function armConnectTimer() {
  clearConnectTimer()
  connectTimer = window.setTimeout(() => {
    const el = videoDom.value
    if (closed)
      return
    if (el?.srcObject && el.readyState >= 2)
      return
    failed.value = '画面连接超时'
  }, 10000)
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
  clearConnectTimer()
  failed.value = ''
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
  armConnectTimer()
  const result = await sendPlayerMessage({ type: 'ENO_LIVE_MIRROR_START' })
  if (!result?.ok && !closed && !pc) {
    clearConnectTimer()
    failed.value = result?.error || '暂时没有直播画面'
  }
}

function stop() {
  closed = true
  clearConnectTimer()
  pc?.close()
  pc = null
  const el = videoDom.value
  if (el) {
    el.pause()
    el.srcObject = null
  }
  void sendPlayerMessage({ type: 'ENO_LIVE_MIRROR_STOP' }).catch(() => {})
}

function retry() {
  if (closed)
    return
  pc?.close()
  pc = null
  const el = videoDom.value
  if (el)
    el.srcObject = null
  void start()
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
      <span>{{ failed }}</span>
      <button type="button" class="video-retry" @click="retry">
        重试
      </button>
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

/* 直播画面失败：纸页式提示条 */
.video-fail {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-lg);
  background: rgb(16 15 19 / 88%);
  color: var(--eno-text-1);
  font-family: var(--app-font-sans);
  font-size: 13px;
}

.video-retry {
  height: 24px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
  color: var(--lp-paper);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), transform 0.12s var(--eno-ease);
}

.video-retry:hover {
  background: var(--lp-seal-deep);
}

.video-retry:active {
  transform: translateY(1px);
}
</style>
