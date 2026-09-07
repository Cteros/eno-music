<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

async function playVideo() {
  const el = videoDom.value
  if (!el || !props.videoUrl)
    return

  ensureMuted()

  const start = async () => {
    syncVideo(true)
    try {
      await el.play()
    }
    catch {
      // autoplay / abort can throw; sync loop will retry on next tick
    }
    startSyncLoop()
  }

  if (el.readyState >= 1) {
    await start()
    return
  }

  el.addEventListener('loadedmetadata', () => {
    void start()
  }, { once: true })
}

function pauseVideo() {
  stopSyncLoop()
  syncVideo(true)
  videoDom.value?.pause()
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
  stopSyncLoop()
  window.removeEventListener('focus', onWindowFocus)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="video-stage" @click.self="closeVideo">
      <button
        class="video-close"
        type="button"
        title="关闭视频"
        @click="closeVideo"
      >
        <div class="i-mingcute:close-line" />
      </button>
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
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
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
}

.video-close:hover {
  background: rgb(0 0 0 / 75%);
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
