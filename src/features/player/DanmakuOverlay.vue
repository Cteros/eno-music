<script setup lang="ts">
import type { DanmakuHit } from './fetchDanmaku'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  hits: {
    type: Array as () => DanmakuHit[],
    default: () => [],
  },
  current: {
    type: Number,
    default: 0,
  },
  enabled: Boolean,
  /** 分栏模式下弹幕只在左侧视频列内飘 */
  split: Boolean,
})

interface Floater {
  id: number
  text: string
  lane: number
}

// 池上限要容得下 9s 全程的在飞弹幕(≈6条/秒×9s)，否则旧弹幕没飘完就被挤掉
const MAX_FLOATERS = 48
const SPAWN_PER_TICK = 2

const floaters = ref<Floater[]>([])
let spawnIndex = 0
let seq = 0
let lastCurrent = 0
let timer = 0

const ordered = computed(() => [...props.hits].sort((a, b) => a.time - b.time))

function reset() {
  spawnIndex = 0
  floaters.value = []
}

function removeFloater(id: number) {
  floaters.value = floaters.value.filter(item => item.id !== id)
}

function tick() {
  if (!props.enabled) {
    if (floaters.value.length)
      floaters.value = []
    return
  }
  const time = props.current || 0
  if (time < lastCurrent - 1)
    reset()
  lastCurrent = time

  const list = ordered.value
  // 进度跳转后丢掉过期弹幕，避免陈旧内容追赶式刷屏
  while (spawnIndex < list.length && list[spawnIndex].time < time - 1.2)
    spawnIndex++

  let spawned = 0
  while (spawnIndex < list.length && list[spawnIndex].time <= time && spawned < SPAWN_PER_TICK) {
    const hit = list[spawnIndex]
    spawnIndex++
    const text = hit.text.slice(0, 26)
    if (!text)
      continue
    spawned++
    floaters.value = [...floaters.value, {
      id: ++seq,
      text,
      lane: seq % 6,
    }].slice(-MAX_FLOATERS)
  }
}

watch(() => props.enabled, () => {
  reset()
})

watch(() => props.hits, () => {
  reset()
})

onBeforeUnmount(() => {
  if (timer)
    clearInterval(timer)
})

timer = window.setInterval(tick, 320)
tick()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="enabled"
      class="danmaku"
      :class="{ 'danmaku--split': split }"
      aria-hidden="true"
    >
      <span
        v-for="item in floaters"
        :key="item.id"
        class="danmaku-item"
        :style="{ top: `${7 + item.lane * 8}%` }"
        @animationend="removeFloater(item.id)"
      >
        {{ item.text }}
      </span>
    </div>
  </Teleport>
</template>

<style scoped>
.danmaku {
  /* --travel: 弹幕从右缘飘到左缘的位移，分栏时列更短要跟着收 */
  --travel: calc(-100vw - 100%);
  position: fixed;
  inset: 0;
  z-index: 31;
  overflow: hidden;
  pointer-events: none;
}

.danmaku--split {
  --travel: calc(-58vw - 100%);
  right: 42%;
}

.danmaku-item {
  position: absolute;
  left: 100%;
  max-width: 30vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 0;
  color: rgb(255 255 255 / 92%);
  font-size: 15px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgb(0 0 0 / 70%);
  animation: danmaku-fly 9.5s linear forwards;
  will-change: transform;
}

@keyframes danmaku-fly {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(var(--travel));
  }
}
</style>
