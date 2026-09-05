<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import cn from 'classnames'
import { VIDEO_MODE, usePlayerStore, useUiStore } from '~/stores'

const props = defineProps({
  isPlaying: Boolean,
  videoUrl: String,
  audioTime: {
    type: Number,
    default: 0,
  },
})
const store = usePlayerStore()
const ui = useUiStore()
const videoDom = ref<HTMLVideoElement | null>(null)
const syncTimer = ref<number | null>(null)

const { toggle } = useFullscreen(videoDom)

const threshold = [20, 20, 100, 20]
const floatingLayer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const position = reactive({ x: window.innerWidth - 220, y: 20 })
const dragOffset = reactive({ x: 0, y: 0 })

const layerStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${position.y}px`,
  left: `${position.x}px`,
  zIndex: 1000,
}))

function startDrag(event: MouseEvent) {
  isDragging.value = true
  dragOffset.x = event.clientX - position.x
  dragOffset.y = event.clientY - position.y
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', stopDrag)
}

function drag(event: MouseEvent) {
  if (!isDragging.value)
    return

  const newX = event.clientX - dragOffset.x
  let newY = event.clientY - dragOffset.y

  if (floatingLayer.value)
    newY = Math.max(0, Math.min(newY, window.innerHeight - floatingLayer.value.offsetHeight))

  position.x = newX
  position.y = newY
  snapToEdges()
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', stopDrag)

  if (!floatingLayer.value)
    return

  const leftDistance = floatingLayer.value.offsetLeft
  const rightDistance = window.innerWidth - (leftDistance + floatingLayer.value.offsetWidth)

  if (leftDistance < rightDistance)
    position.x = 20
  else
    position.x = window.innerWidth - floatingLayer.value.offsetWidth - 20
}

function snapToEdges() {
  if (!floatingLayer.value)
    return

  const layerWidth = floatingLayer.value.offsetWidth
  const layerHeight = floatingLayer.value.offsetHeight

  const leftDistance = position.x - threshold[3]
  const rightDistance = window.innerWidth - (position.x + layerWidth + threshold[1])
  const topDistance = position.y - threshold[0]
  const bottomDistance = window.innerHeight - (position.y + layerHeight + threshold[2])

  if (topDistance < 0)
    position.y = threshold[0]
  if (bottomDistance < 0)
    position.y = window.innerHeight - layerHeight - threshold[2]
  if (leftDistance < rightDistance)
    position.x = threshold[3]
  else
    position.x = window.innerWidth - layerWidth - threshold[1]
}

function getHowlSeek() {
  if (!store.howl)
    return 0
  const seek = store.howl.seek()
  return typeof seek === 'number' ? seek : 0
}

function syncVideo(force = false) {
  const el = videoDom.value
  if (!el || !store.howl)
    return

  const seek = getHowlSeek()
  if (force || Math.abs(el.currentTime - seek) > 0.3)
    el.currentTime = seek
}

function stopSyncLoop() {
  if (syncTimer.value != null) {
    clearInterval(syncTimer.value)
    syncTimer.value = null
  }
}

function startSyncLoop() {
  stopSyncLoop()
  syncTimer.value = window.setInterval(() => syncVideo(false), 400)
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
  videoDom.value?.pause()
  stopSyncLoop()
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

watch(
  [() => props.isPlaying, () => props.videoUrl],
  () => {
    void alignPlayback()
  },
  { immediate: true },
)

watch(
  () => ui.videoMode,
  (mode) => {
    if (mode !== VIDEO_MODE.HIDDEN && props.isPlaying)
      void alignPlayback()
  },
)

// Seek / progress jumps from the audio player
watch(
  () => props.audioTime,
  (time) => {
    const el = videoDom.value
    if (!el || !props.videoUrl)
      return
    if (Math.abs(el.currentTime - time) > 0.35)
      el.currentTime = time
  },
)

onMounted(() => {
  snapToEdges()
  window.addEventListener('resize', snapToEdges)
  window.addEventListener('focus', onWindowFocus)
})

onBeforeUnmount(() => {
  stopSyncLoop()
  window.removeEventListener('resize', snapToEdges)
  window.removeEventListener('focus', onWindowFocus)
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', stopDrag)
})

function toggleFullscreen() {
  toggle()
}

function closeVideo() {
  ui.videoMode = VIDEO_MODE.HIDDEN
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="ui.videoMode === VIDEO_MODE.FLOATING"
      ref="floatingLayer"
      :style="layerStyle"
      :class="cn('w-[400px] cursor-move group ', !isDragging && 'transition-all duration-300 ease-in-out')"
      @mousedown="startDrag"
    >
      <video
        id="video-eno"
        ref="videoDom"
        class="transItem w-full h-full object-fill rd-lg overflow-auto"
        muted
        playsinline
        :src="props.videoUrl"
      />
      <div
        class="text-white absolute top-0 left-0 hidden h-full w-full justify-end bg-black/30 p-4 group-hover:flex"
      >
        <div
          class="i-mingcute:fullscreen-line mr-3 h-4 w-4 cursor-pointer"
          @click="toggleFullscreen"
        />
        <div class="i-mingcute:close-line h-4 w-4 cursor-pointer" @click="closeVideo" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.transItem {
  transition: transform 0.3s ease-in-out;
  background: #000;
}
</style>
