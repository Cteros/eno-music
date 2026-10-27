<script setup lang="ts">
import type { DanmakuHit } from './fetchDanmaku'
import type { LyricDoc, LyricLine } from './fetchLyrics'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useApiClient } from '~/api'
import { danmakuDensity, visibleDanmaku } from './fetchDanmaku'
import { emptyLyricDoc, fetchLyrics, needsWordSpace } from './fetchLyrics'

const props = defineProps({
  bvid: String,
  cid: [String, Number],
  current: {
    type: Number,
    default: 0,
  },
  crowd: {
    type: Array as () => DanmakuHit[],
    default: () => [],
  },
  /** overlay = 悬浮卡片；split = 全屏视频右侧分栏 */
  layout: {
    type: String,
    default: 'overlay',
  },
})

const doc = ref<LyricDoc>(emptyLyricDoc())
const loading = ref(false)
const failed = ref(false)
const scroller = ref<HTMLElement | null>(null)
const showCrowd = useLocalStorage('showDanmaku', true)
const showTrans = useLocalStorage('showLyricTrans', true)
const showRomaji = useLocalStorage('showLyricRomaji', true)

const lines = computed(() => doc.value.lines)

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
  return visibleDanmaku(props.crowd, props.current || 0)
})

const crowdLevel = computed(() => {
  if (!showCrowd.value)
    return 0
  return danmakuDensity(props.crowd, props.current || 0)
})

function wordClass(line: LyricLine, index: number, time: number) {
  const word = line.words[index]
  if (!word)
    return ''
  if (time >= word.to)
    return 'lyric-word--sung'
  if (time >= word.from)
    return 'lyric-word--sung lyric-word--now'
  return ''
}

function spaceBefore(line: LyricLine, index: number) {
  if (!index)
    return false
  return needsWordSpace(line.words[index - 1]?.text || '', line.words[index]?.text || '')
}

let fetchToken = 0

watch(
  [() => props.bvid, () => props.cid],
  async ([bvid, cid]) => {
    // 令牌防串歌：每次请求全程绑定同一 token，
    // 尤其是异步补 cid 之后再发请求前必须复查，
    // 否则会出现 bvid 是新歌、cid 是旧歌的混合参数（歌词就串视频了）
    const token = ++fetchToken
    doc.value = emptyLyricDoc()
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
        if (token !== fetchToken)
          return
        cidValue = info?.data?.cid
      }
      const result = await fetchLyrics({ bvid, cid: cidValue })
      if (token !== fetchToken)
        return
      doc.value = result
    }
    catch {
      if (token !== fetchToken)
        return
      failed.value = true
      doc.value = emptyLyricDoc()
    }
    finally {
      if (token === fetchToken)
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
  <Teleport to="body">
    <div class="lyrics-panel" :class="{ 'lyrics-panel--split': layout === 'split' }">
      <div class="lyrics-bar">
        <button
          v-if="doc.hasTranslation"
          type="button"
          class="lyric-toggle"
          :class="{ 'lyric-toggle--on': showTrans }"
          title="翻译"
          @click="showTrans = !showTrans"
        >
          译
        </button>
        <button
          v-if="doc.hasRomaji"
          type="button"
          class="lyric-toggle"
          :class="{ 'lyric-toggle--on': showRomaji }"
          title="罗马音"
          @click="showRomaji = !showRomaji"
        >
          音
        </button>
        <button
          type="button"
          class="lyric-toggle"
          :class="{ 'lyric-toggle--on': showCrowd }"
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
        <div
          v-for="(line, index) in lines"
          :key="`${line.from}-${index}`"
          :data-line="index"
          class="lyrics-line"
          :class="{ 'lyrics-line--active': index === activeIndex }"
        >
          <p class="lyrics-main">
            <template v-if="index === activeIndex && line.words.length">
              <span
                v-for="(word, wi) in line.words"
                :key="`${word.from}-${wi}`"
                class="lyric-word"
                :class="wordClass(line, wi, current)"
              ><span v-if="spaceBefore(line, wi)" />{{ word.text }}</span>
            </template>
            <template v-else>
              {{ line.content }}
            </template>
          </p>
          <p v-if="showTrans && line.translation" class="lyrics-sub">
            {{ line.translation }}
          </p>
          <p v-if="showRomaji && line.romaji" class="lyrics-sub lyrics-sub--romaji">
            {{ line.romaji }}
          </p>
        </div>
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
  </Teleport>
</template>

<style scoped>
.lyrics-panel {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 96px;
  z-index: 30;
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
  gap: 2px;
  padding: 8px 10px 0;
}

.lyric-toggle {
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

.lyric-toggle:hover,
.lyric-toggle--on {
  color: #fff;
}

.lyric-toggle--on {
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
  text-align: center;
  transition: opacity 0.22s var(--eno-ease), transform 0.22s var(--eno-ease);
}

.lyrics-main {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
  color: #7a7a7a;
  transition: color 0.22s var(--eno-ease);
}

.lyrics-line--active {
  transform: scale(1.06);
}

.lyrics-line--active .lyrics-main {
  font-weight: 700;
}

.lyric-word {
  color: rgb(255 255 255 / 38%);
  transition: color 0.12s linear, text-shadow 0.12s linear;
}

.lyric-word--sung {
  color: color-mix(in srgb, var(--eno-cover-accent, #1ed760) 55%, #fff);
}

.lyric-word--now {
  color: #fff;
  text-shadow: 0 0 12px color-mix(in srgb, var(--eno-cover-accent, #1ed760) 80%, transparent);
}

.lyrics-sub {
  margin: 4px 0 0;
  color: #7a7a7a;
  font-size: 13px;
  line-height: 1.45;
}

.lyrics-line--active .lyrics-sub {
  color: #b3b3b3;
}

.lyrics-sub--romaji {
  font-style: italic;
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

/* —— 全屏视频分栏模式：右列歌词 —— */
.lyrics-panel--split {
  top: 0;
  right: 0;
  bottom: 80px;
  left: auto;
  width: 42%;
  max-width: none;
  height: auto;
  border: 0;
  border-left: 1px solid rgb(255 255 255 / 6%);
  border-radius: 0;
  background: linear-gradient(90deg, rgb(10 10 10 / 20%), rgb(10 10 10 / 84%) 24%);
  backdrop-filter: blur(18px);
}

.lyrics-panel--split .lyrics-bar {
  padding: 18px 20px 0;
}

.lyrics-panel--split .lyrics-scroll {
  padding: 32px 36px 24px;
}

.lyrics-panel--split .lyrics-line {
  margin-bottom: 22px;
}

.lyrics-panel--split .lyrics-main {
  font-size: 21px;
  line-height: 1.55;
}

.lyrics-panel--split .lyrics-line--active {
  transform: none;
}

.lyrics-panel--split .lyrics-line--active .lyrics-main {
  font-size: 27px;
  font-weight: 700;
}

.lyrics-panel--split .lyrics-sub {
  margin-top: 6px;
  font-size: 14px;
}

.lyrics-panel--split .lyrics-hint {
  color: #9a9a9a;
  font-size: 15px;
}

.lyrics-panel--split .crowd {
  max-height: 72px;
  padding: 0 20px 18px;
}
</style>
