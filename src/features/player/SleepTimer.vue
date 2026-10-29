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
      <span class="i-tabler:moon" />
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
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 18px;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.sleep-btn:hover {
  color: var(--eno-text-1);
}

.sleep-btn.sleep-btn--on,
.sleep-btn.sleep-btn--on:hover {
  color: var(--lp-seal-bright);
}

.sleep-left {
  font-family: var(--app-font-sans);
  font-size: 11px;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

.sleep-menu {
  position: absolute;
  right: 0;
  bottom: 32px;
  z-index: 30;
  min-width: 132px;
  padding: 6px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-lg);
  background: var(--eno-elevated);
  box-shadow: var(--eno-shadow-md);
}

.sleep-item {
  display: block;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  background: transparent;
  color: var(--eno-text-2);
  font-family: var(--app-font-sans);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.14s var(--eno-ease), color 0.14s var(--eno-ease);
}

.sleep-item:hover {
  background: var(--eno-fill-2);
  color: var(--eno-text-1);
}

.sleep-item:active {
  background: var(--eno-fill-2);
}

.sleep-item--muted {
  color: var(--eno-text-3);
}

.sleep-menu--down {
  position: static;
  margin-top: 6px;
  min-width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .sleep-btn,
  .sleep-item {
    transition: none;
  }
}
</style>
