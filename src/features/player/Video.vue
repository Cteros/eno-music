<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useUiStore } from '~/stores'

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

const ui = useUiStore()
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
      // autoplay / abort can throw; sync loop will retry on next tick
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

async function alignPlayback() {
  await nextTick()
  if (props.isPlaying && props.videoUrl)
    await playVideo()
  else
    pauseVideo()
}

function onWindowFocus() {
  if (props.isPlaying && props.videoUrl) {
    ensureMuted()
    void videoDom.value?.play()
    syncVideo(true)
    startSyncLoop()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    ui.showVideo = false
}

function closeVideo() {
  ui.showVideo = false
}

watch(
  [() => props.isPlaying, () => props.videoUrl],
  () => {
    void alignPlayback()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('focus', onWindowFocus)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  playGen++
  stopSyncLoop()
  window.removeEventListener('focus', onWindowFocus)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="video-stage">
      <button
        class="video-close"
        type="button"
        title="关闭视频"
        @click="closeVideo"
      >
        <div class="i-mingcute:close-line" />
      </button>
      <img
        v-if="props.cover"
        class="video-aura"
        :src="props.cover"
        alt=""
      >
      <img
        v-if="props.cover"
        class="video-aura video-aura--right"
        :src="props.cover"
        alt=""
      >
      <video
        v-if="props.videoUrl"
        id="video-eno"
        :key="props.videoUrl"
        ref="videoDom"
        class="video-el"
        muted
        playsinline
        preload="auto"
        :src="props.videoUrl"
      />
      <img
        v-else-if="props.cover"
        class="video-cover"
        :src="props.cover"
        alt=""
      >
      <div v-else class="video-empty">
        暂无画面
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.video-stage {
  position: fixed;
  inset: 0 0 80px;
  z-index: 19;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

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

.video-aura {
  position: absolute;
  inset: -18% 0;
  z-index: 0;
  width: 100%;
  height: 136%;
  object-fit: cover;
  filter: blur(64px) saturate(1.45);
  opacity: 0.58;
  pointer-events: none;
}

.video-aura--right {
  inset: auto -8% 0 42%;
  width: auto;
  height: 130%;
  object-position: right center;
  filter: blur(72px) saturate(1.6);
  opacity: 0.72;
  mask-image: linear-gradient(90deg, transparent, #000 28%);
}

.video-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  font-size: 20px;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.video-close:hover {
  background: rgb(0 0 0 / 75%);
  transform: scale(1.06);
}

.video-close:active {
  transform: scale(0.92);
}

.video-empty {
  color: #b3b3b3;
  font-size: 14px;
}

@media (max-width: 900px) {
  .video-stage {
    inset: 0;
  }
}
</style>
