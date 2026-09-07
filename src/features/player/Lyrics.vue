<script setup lang="ts">
import type { LyricLine } from './fetchLyrics'
import { computed, ref, watch } from 'vue'
import { fetchLyrics } from './fetchLyrics'

const props = defineProps({
  bvid: String,
  cid: [String, Number],
  current: {
    type: Number,
    default: 0,
  },
})

const lines = ref<LyricLine[]>([])
const loading = ref(false)
const failed = ref(false)
const scroller = ref<HTMLElement | null>(null)

const activeIndex = computed(() => {
  const time = props.current || 0
  let index = -1
  for (let i = 0; i < lines.value.length; i++) {
    if (time >= lines.value[i].from)
      index = i
    else
      break
  }
  return index
})

watch(
  () => [props.bvid, props.cid] as const,
  async ([bvid]) => {
    lines.value = []
    failed.value = false
    if (!bvid) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      lines.value = await fetchLyrics({ bvid, cid: props.cid })
    }
    catch {
      failed.value = true
      lines.value = []
    }
    finally {
      loading.value = false
    }
  },
  { immediate: true },
)

watch(activeIndex, (index) => {
  const root = scroller.value
  if (!root || index < 0)
    return
  const el = root.querySelector(`[data-line="${index}"]`) as HTMLElement | null
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
})
</script>

<template>
  <div class="lyrics-panel">
    <div v-if="loading" class="lyrics-hint">
      正在读取字幕…
    </div>
    <div v-else-if="failed" class="lyrics-hint">
      字幕加载失败
    </div>
    <div v-else-if="!lines.length" class="lyrics-hint">
      这首没有可用字幕
    </div>
    <div v-else ref="scroller" class="lyrics-scroll">
      <p
        v-for="(line, index) in lines"
        :key="`${line.from}-${index}`"
        :data-line="index"
        class="lyrics-line"
        :class="{ 'lyrics-line--active': index === activeIndex }"
      >
        {{ line.content }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.lyrics-panel {
  position: fixed;
  left: 280px;
  right: 16px;
  bottom: 96px;
  z-index: 18;
  max-width: 720px;
  height: min(38vh, 280px);
  margin: 0 auto;
  overflow: hidden;
  border-radius: 12px;
  background: rgb(18 18 18 / 90%);
}

.lyrics-scroll {
  height: 100%;
  overflow: auto;
  padding: 48px 24px;
}

.lyrics-line {
  margin: 0 0 16px;
  font-size: 18px;
  line-height: 1.5;
  color: #7a7a7a;
  text-align: center;
  transition: color 0.16s ease, transform 0.16s ease;
}

.lyrics-line--active {
  color: #fff;
  font-weight: 700;
  transform: scale(1.04);
}

.lyrics-hint {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #b3b3b3;
  font-size: 14px;
}

@media (max-width: 860px) {
  .lyrics-panel {
    left: 12px;
    right: 12px;
  }
}
</style>
