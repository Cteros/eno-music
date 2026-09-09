<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VideoStage from './VideoStage.vue'

const props = defineProps({
  isPlaying: Boolean,
  isDragging: Boolean,
  videoUrl: String,
  cover: String,
  audioTime: {
    type: Number,
    default: 0,
  },
  audioRate: {
    type: Number,
    default: 1,
  },
})

const videoDom = ref<HTMLVideoElement | null>(null)
const syncTimer = ref<number | null>(null)
let lastTarget = 0
let playGen = 0

function syncVideo(force = false) {
  const el = videoDom.value
  if (!el || !props.videoUrl)
    return
  if (!force && (el.seeking || el.readyState < 1))
    return

  const target = Math.max(0, Number(props.audioTime) || 0)
  const drift = el.currentTime - target
  const base = props.audioRate > 0 ? props.audioRate : 1

  if (force || Math.abs(target - lastTarget) > 1) {
    el.playbackRate = base
    if (Math.abs(drift) > 0.05)
      el.currentTime = target
    lastTarget = target
    return
  }
  lastTarget = target

  if (props.isDragging)
    return

  if (props.isPlaying && el.paused)
    void el.play().catch(() => {})

  if (!props.isPlaying) {
    el.playbackRate = base
    if (Math.abs(drift) > 0.08)
      el.currentTime = target
    return
  }

  if (Math.abs(drift) > 0.8) {
    el.playbackRate = base
    el.currentTime = target
    return
  }

  if (Math.abs(drift) > 0.12)
    el.playbackRate = drift > 0 ? base * 0.96 : base * 1.04
  else
    el.playbackRate = base
}

function stopSyncLoop() {
  if (syncTimer.value != null) {
    cancelAnimationFrame(syncTimer.value)
    syncTimer.value = null
  }
}

function startSyncLoop() {
  stopSyncLoop()
  const step = () => {
    syncVideo()
    syncTimer.value = requestAnimationFrame(step)
  }
  syncTimer.value = requestAnimationFrame(step)
}

function ensureMuted() {
  const el = videoDom.value
  if (!el)
    return
  el.muted = true
  el.volume = 0
  el.playsInline = true
}

function fitVideoBox() {
  const el = videoDom.value
  if (!el || !el.videoWidth || !el.videoHeight)
    return
  el.style.aspectRatio = `${el.videoWidth} / ${el.videoHeight}`
}

async function playVideo() {
  const el = videoDom.value
  if (!el || !props.videoUrl)
    return

  const gen = ++playGen
  ensureMuted()
  if (el.getAttribute('src') !== props.videoUrl)
    el.src = props.videoUrl

  const start = async () => {
    if (gen !== playGen)
      return
    fitVideoBox()
    syncVideo(true)
    if (gen !== playGen || !props.isPlaying) {
      el.pause()
      return
    }
    try {
      await el.play()
    }
    catch {
      // autoplay / abort can throw; sync loop will retry
    }
    if (gen !== playGen || !props.isPlaying) {
      el.pause()
      return
    }
    startSyncLoop()
  }

  if (el.readyState >= 1) {
    await start()
    return
  }

  el.addEventListener('loadedmetadata', () => {
    fitVideoBox()
    void start()
  }, { once: true })
}

function pauseVideo() {
  playGen++
  stopSyncLoop()
  const el = videoDom.value
  if (el) {
    el.pause()
    if (el.readyState >= 1)
      syncVideo(true)
  }
}

async function alignPlayPause() {
  await nextTick()
  if (!videoDom.value)
    return
  if (props.isPlaying && props.videoUrl)
    await playVideo()
  else
    pauseVideo()
}

function onWindowFocus() {
  if (props.isPlaying && props.videoUrl) {
    ensureMuted()
    void videoDom.value?.play().catch(() => {})
    syncVideo(true)
    startSyncLoop()
  }
}

watch(
  [() => props.videoUrl, () => props.isPlaying, videoDom],
  () => {
    void alignPlayPause()
  },
  { flush: 'post' },
)

onMounted(() => {
  window.addEventListener('focus', onWindowFocus)
  void alignPlayPause()
})

onBeforeUnmount(() => {
  playGen++
  stopSyncLoop()
  window.removeEventListener('focus', onWindowFocus)
})
</script>

<template>
  <VideoStage :cover="cover">
    <video
      ref="videoDom"
      class="video-el"
      :class="{ 'video-el--idle': !videoUrl }"
      playsinline
      muted
      preload="auto"
    />
    <img
      v-if="!videoUrl && cover"
      class="video-cover"
      :src="cover"
      alt=""
    >
  </VideoStage>
</template>

<style scoped>
.video-el,
.video-cover {
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

.video-el--idle {
  display: none;
}
</style>
