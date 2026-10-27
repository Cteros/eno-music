<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sendPlayerMessage } from '~/shared/playerBridge'
import VideoStage from './VideoStage.vue'

const props = defineProps({
  isPlaying: Boolean,
  isDragging: Boolean,
  videoUrl: String,
  cover: String,
  song: {
    type: Object,
    default: null,
  },
  audioTime: {
    type: Number,
    default: 0,
  },
  audioRate: {
    type: Number,
    default: 1,
  },
  lyricsOpen: Boolean,
})

const videoDom = ref<HTMLVideoElement | null>(null)
const syncTimer = ref<number | null>(null)
let lastTarget = 0
let playGen = 0
let activeUrl = ''
let refreshLeft = 2
let refreshToken = 0

watch(
  () => props.videoUrl,
  (url) => {
    refreshLeft = 2
    refreshToken++
    activeUrl = url || ''
  },
  { immediate: true },
)

function syncVideo(force = false) {
  const el = videoDom.value
  if (!el || !activeUrl)
    return
  if (el.error)
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

function applySrc(url: string) {
  const el = videoDom.value
  if (!el)
    return
  activeUrl = url
  if (el.getAttribute('src') !== url)
    el.src = url
}

async function playVideo() {
  const el = videoDom.value
  const url = activeUrl || props.videoUrl || ''
  if (!el || !url)
    return

  const gen = ++playGen
  ensureMuted()
  applySrc(url)

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

  const onMeta = () => {
    void start()
  }
  el.addEventListener('loadedmetadata', onMeta, { once: true })
  // 避免 readyState 停在 0 时监听悬挂
  window.setTimeout(() => {
    if (gen === playGen && el.readyState >= 1)
      void start()
    el.removeEventListener('loadedmetadata', onMeta)
  }, 3000)
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
  if (props.isPlaying && (activeUrl || props.videoUrl))
    await playVideo()
  else
    pauseVideo()
}

// B 站 CDN 地址带签名会过期；过期后元素报错，需要重新解析并重试
async function refreshVideoUrl() {
  if (!props.song || refreshLeft <= 0)
    return false
  refreshLeft -= 1
  const token = ++refreshToken
  try {
    const result = await sendPlayerMessage({
      type: 'ENO_RESOLVE_URL',
      song: {
        ...props.song,
        url: undefined,
        video: undefined,
        dash: undefined,
      },
    })
    // 切歌后旧响应不能回填，否则新视频会顶着旧视频的地址
    if (token !== refreshToken)
      return false
    const next = result?.song?.video
    if (!result?.ok || !next)
      return false
    applySrc(next)
    return true
  }
  catch {
    return false
  }
}

async function onVideoError() {
  if (!activeUrl)
    return
  const refreshed = await refreshVideoUrl()
  if (!refreshed)
    return
  playGen++
  await alignPlayPause()
}

function onVisibility() {
  if (document.hidden)
    return
  if (props.isPlaying && (activeUrl || props.videoUrl)) {
    ensureMuted()
    void videoDom.value?.play().catch(() => {})
    syncVideo(true)
    startSyncLoop()
  }
}

function onWindowFocus() {
  onVisibility()
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
  document.addEventListener('visibilitychange', onVisibility)
  videoDom.value?.addEventListener('error', () => {
    void onVideoError()
  })
  void alignPlayPause()
})

onBeforeUnmount(() => {
  playGen++
  stopSyncLoop()
  window.removeEventListener('focus', onWindowFocus)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <VideoStage :cover="cover" :split="lyricsOpen">
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
