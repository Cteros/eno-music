<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import cn from 'classnames'
import { VIDEO_MODE, useBlblStore } from '../../blbl/store'

// 交互相关
const props = defineProps({
  isPlaying: Boolean,
  videoUrl: String,
})
const store = useBlblStore()
const videoDom = ref(null)
// const timer = ref(null)

const { toggle } = useFullscreen(videoDom)

// 拖动相关
const threshold = [20, 20, 100, 20]
const floatingLayer = ref(null)
const isDragging = ref(false)
const position = reactive({ x: window.innerWidth - 220, y: 20 })
const dragOffset = reactive({ x: 0, y: 0 })

const layerStyle = computed(() => ({
  position: 'fixed',
  top: `${position.y}px`,
  left: `${position.x}px`,
  zIndex: 1000,
}))

function startDrag(event) {
  isDragging.value = true
  dragOffset.x = event.clientX - position.x
  dragOffset.y = event.clientY - position.y
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', stopDrag)
}

function drag(event) {
  if (isDragging.value) {
    const newX = event.clientX - dragOffset.x
    let newY = event.clientY - dragOffset.y

    // 限制 Y 轴不超出屏幕
    if (floatingLayer.value) {
      newY = Math.max(0, Math.min(newY, window.innerHeight - floatingLayer.value.offsetHeight))
    }

    position.x = newX
    position.y = newY
    snapToEdges()
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', stopDrag)
  // 吸附到左边或右边

  // 计算元素到左边距离
  const leftDistance = floatingLayer.value ? floatingLayer.value.offsetLeft : 0
  const rightDistance = window.innerWidth - (leftDistance + floatingLayer.value.offsetWidth)

  if (leftDistance < rightDistance) {
    position.x = 20
  }
  else {
    position.x = window.innerWidth - floatingLayer.value.offsetWidth - 20
  }
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

  // const minDistance = Math.min(leftDistance, rightDistance, topDistance, bottomDistance)
  if (topDistance < 0) {
    position.y = threshold[0]
  }
  if (bottomDistance < 0) {
    position.y = window.innerHeight - layerHeight - threshold[2]
  }
  // 判断离左边和右边距离哪个近
  if (leftDistance < rightDistance) {
    position.x = threshold[3]
  }
  else {
    position.x = window.innerWidth - layerWidth - threshold[1]
  }
}

onMounted(() => {
  snapToEdges()
  // 窗口变化时，吸附到边缘
  window.addEventListener('resize', snapToEdges)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', snapToEdges)
})
// isPlaying, 和 videoUrl 变化时，同步视频
watch([() => props.isPlaying, () => props.videoUrl], ([newIsPlaying, newVideoUrl]) => {
  if (newIsPlaying && newVideoUrl) {
    // 等待 videoDom 渲染完成
    nextTick(() => {
      videoDom.value.play()
      syncVideo()
    })
    // timer.value = setInterval(() => {
    //   syncVideo()
    // }, 1000)
  }
  else {
    videoDom.value.pause()
  }
})

window.addEventListener('focus', () => {
  if (props.isPlaying && props.videoUrl)
    videoDom.value.play()
  syncVideo()
})
function syncVideo() {
  if (videoDom.value && store.howl)
    videoDom.value.currentTime = store.howl.seek()
}
function toggleFullscreen() {
  toggle()
}
function closeVideo() {
  store.videoMode = VIDEO_MODE.HIDDEN
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="store.videoMode === VIDEO_MODE.FLOATING"
      ref="floatingLayer"
      :style="layerStyle"
      :class="cn('w-[400px] cursor-move group ', !isDragging && 'transition-all duration-300 ease-in-out')"
      @mousedown="startDrag"
    >
      <video
        id="video-eno"
        ref="videoDom"
        w-full h-full object-fill rd-lg overflow-auto
        class="transItem"
        :src="props.videoUrl"
      />
      <div
        w-full h-full
        absolute top-0 left-0
        p-4
        bg="black/30"
        class="text-$eno-text-1"
        justify-end
        hidden
        group-hover:flex
      >
        <!-- <div
          class="i-material-symbols:float-landscape-2-outline-rounded w-1rem h-1rem mr-3 cursor-pointer"
        /> -->
        <!-- 全屏 -->
        <div
          class="i-mingcute:fullscreen-line w-1rem h-1rem cursor-pointer mr-3"
          @click="toggleFullscreen"
        />
        <div class="i-mingcute:close-line w-1rem h-1rem cursor-pointer" @click="closeVideo" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 弹性动画 */
.transItem {
  transition: transform 0.3s ease-in-out;
}
</style>
