<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { formatPlayerTime } from '~/shared/playerBridge'

const props = withDefaults(defineProps<{
  sleepUntil: number
  sleepAfterCurrent: boolean
  drop?: 'up' | 'down'
}>(), {
  drop: 'up',
})

const emit = defineEmits<{
  set: [minutes: number, afterCurrent?: boolean]
}>()

const open = ref(false)
const now = ref(Date.now())
let timer = 0

const options = [
  { minutes: 15, label: '15 分钟' },
  { minutes: 30, label: '30 分钟' },
  { minutes: 45, label: '45 分钟' },
  { minutes: 60, label: '60 分钟' },
]

const active = computed(() => props.sleepAfterCurrent || props.sleepUntil > Date.now())

const remaining = computed(() => {
  if (props.sleepAfterCurrent)
    return '本首'
  if (!props.sleepUntil)
    return ''
  const seconds = Math.max(0, Math.ceil((props.sleepUntil - now.value) / 1000))
  return formatPlayerTime(seconds)
})

function pick(minutes: number, afterCurrent = false) {
  emit('set', minutes, afterCurrent)
  open.value = false
}

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer)
    window.clearInterval(timer)
})
</script>

<template>
  <div class="sleep-wrap">
    <button
      type="button"
      class="sleep-btn"
      :class="{ 'sleep-btn--on': active }"
      :title="active ? `睡眠定时 ${remaining}` : '睡眠定时'"
      @click.stop="open = !open"
    >
      <span class="i-mingcute:moon-fill" />
      <span v-if="active" class="sleep-left">{{ remaining }}</span>
    </button>
    <div
      v-if="open"
      class="sleep-menu"
      :class="{ 'sleep-menu--down': drop === 'down' }"
      @click.stop
    >
      <button type="button" class="sleep-item" @click="pick(0, true)">
        播完这首
      </button>
      <button
        v-for="item in options"
        :key="item.minutes"
        type="button"
        class="sleep-item"
        @click="pick(item.minutes)"
      >
        {{ item.label }}
      </button>
      <button v-if="active" type="button" class="sleep-item sleep-item--muted" @click="pick(0)">
        取消定时
      </button>
    </div>
  </div>
</template>

<style scoped>
.sleep-wrap {
  position: relative;
}

.sleep-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #b3b3b3;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.sleep-btn:hover,
.sleep-btn--on {
  color: #1ed760;
}

.sleep-btn:hover {
  transform: scale(1.08);
}

.sleep-btn:active {
  transform: scale(0.9);
}

.sleep-left {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.sleep-menu {
  position: absolute;
  right: 0;
  bottom: 28px;
  z-index: 30;
  min-width: 120px;
  padding: 6px;
  border-radius: 8px;
  background: #282828;
  box-shadow: 0 8px 24px rgb(0 0 0 / 45%);
}

.sleep-item {
  display: block;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #fff;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.sleep-item:hover {
  background: #3e3e3e;
}

.sleep-item:active {
  background: #232323;
}

.sleep-item--muted {
  color: #b3b3b3;
}

.sleep-menu--down {
  position: static;
  margin-top: 6px;
  min-width: 100%;
}
</style>
