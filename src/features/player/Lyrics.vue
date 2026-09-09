<script setup lang="ts">
import type { DanmakuHit } from './fetchDanmaku'
import type { LyricLine } from './fetchLyrics'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useApiClient } from '~/api'
import { danmakuDensity, fetchDanmaku, visibleDanmaku } from './fetchDanmaku'
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
const crowd = ref<DanmakuHit[]>([])
const loading = ref(false)
const failed = ref(false)
const scroller = ref<HTMLElement | null>(null)
const showCrowd = useLocalStorage('showDanmaku', true)

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

const crowdChips = computed(() => {
  if (!showCrowd.value)
    return []
  return visibleDanmaku(crowd.value, props.current || 0)
})

const crowdLevel = computed(() => {
  if (!showCrowd.value)
    return 0
  return danmakuDensity(crowd.value, props.current || 0)
})

watch(
  () => [props.bvid, props.cid] as const,
  async ([bvid, cid]) => {
    lines.value = []
    crowd.value = []
    failed.value = false
    if (!bvid) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      let cidValue = cid
      if (!cidValue) {
        const info = await useApiClient().blbl.getVideoInfo({ bvid })
        cidValue = info?.data?.cid
      }
      const [lyrics, danmaku] = await Promise.all([
        fetchLyrics({ bvid, cid: cidValue }),
        cidValue
          ? fetchDanmaku(cidValue).catch(() => [] as DanmakuHit[])
          : Promise.resolve([] as DanmakuHit[]),
      ])
      lines.value = lyrics
      crowd.value = danmaku
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
    <div class="lyrics-bar">
      <button
        type="button"
        class="crowd-toggle"
        :class="{ 'crowd-toggle--on': showCrowd }"
        title="弹幕人声"
        @click="showCrowd = !showCrowd"
      >
        人声
      </button>
    </div>
    <div v-if="loading" class="lyrics-hint">
      正在读取字幕…
    </div>
    <div v-else-if="failed" class="lyrics-hint">
      字幕加载失败
    </div>
    <div v-else-if="!lines.length" class="lyrics-hint">
      {{ crowd.length && showCrowd ? '没有字幕，下面是弹幕' : '这首没有可用字幕' }}
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
    <div
      v-if="showCrowd && crowdChips.length"
      class="crowd"
      :style="{ '--crowd': String(crowdLevel) }"
    >
      <span
        v-for="chip in crowdChips"
        :key="chip"
        class="crowd-chip"
      >{{ chip }}</span>
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
  display: flex;
  flex-direction: column;
  max-width: 720px;
  height: min(42vh, 320px);
  margin: 0 auto;
  overflow: hidden;
  border-radius: 12px;
  background: rgb(18 18 18 / 90%);
}

.lyrics-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 10px 0;
}

.crowd-toggle {
  height: 22px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #7a7a7a;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.crowd-toggle:hover,
.crowd-toggle--on {
  color: #fff;
}

.crowd-toggle--on {
  background: rgb(255 255 255 / 8%);
}

.lyrics-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 28px 24px 16px;
}

.lyrics-line {
  margin: 0 0 16px;
  font-size: 18px;
  line-height: 1.5;
  color: #7a7a7a;
  text-align: center;
  transition: color 0.22s var(--eno-ease), transform 0.22s var(--eno-ease), opacity 0.22s var(--eno-ease);
}

.lyrics-line--active {
  color: color-mix(in srgb, var(--eno-cover-accent, #1ed760) 28%, #fff);
  font-weight: 700;
  transform: scale(1.06);
}

.crowd {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  max-height: 56px;
  overflow: hidden;
  padding: 0 16px 12px;
  opacity: calc(0.42 + var(--crowd, 0) * 0.5);
}

.crowd-chip {
  max-width: 148px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: #b3b3b3;
  font-size: 11px;
}

.lyrics-hint {
  display: flex;
  min-height: 0;
  flex: 1;
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
