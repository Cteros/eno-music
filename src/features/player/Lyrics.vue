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
const scroller = ref<HTMLElement | null>(null)
const reloadTick = ref(0)
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

function retry() {
  reloadTick.value++
}

watch(
  [() => props.bvid, () => props.cid, reloadTick],
  async ([bvid, cid]) => {
    // 令牌防串歌：每次请求全程绑定同一 token，
    // 尤其是异步补 cid 之后再发请求前必须复查，
    // 否则会出现 bvid 是新歌、cid 是旧歌的混合参数（歌词就串视频了）
    const token = ++fetchToken
    doc.value = emptyLyricDoc()
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
      // fetchLyrics 内部已兜底重试，失败也不会抛
      const result = await fetchLyrics({ bvid, cid: cidValue })
      if (token !== fetchToken)
        return
      doc.value = result
    }
    catch {
      if (token !== fetchToken)
        return
      doc.value = { ...emptyLyricDoc(), error: '歌词获取失败' }
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
      <div v-else-if="doc.error" class="lyrics-hint lyrics-hint--error">
        <span>字幕加载失败</span>
        <button type="button" class="lyric-retry" @click="retry">
          重试
        </button>
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
/* —— 歌词：书页上的歌词本，宋体正文 + 朱红当前字 —— */
.lyrics-panel {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 116px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  height: min(42vh, 320px);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-lg);
  background: rgb(22 21 26 / 94%);
  box-shadow: var(--eno-shadow-lg);
}

.lyrics-bar {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 10px 12px 0;
}

.lyric-toggle {
  height: 24px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--eno-radius-sm);
  background: transparent;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.14s var(--eno-ease), background-color 0.14s var(--eno-ease), border-color 0.14s var(--eno-ease);
}

.lyric-toggle:hover {
  color: var(--eno-text-1);
}

.lyric-toggle--on,
.lyric-toggle--on:hover {
  border-color: rgb(217 86 74 / 55%);
  background: var(--eno-primary-light);
  color: var(--lp-seal-bright);
}

.lyrics-scroll {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 28px 24px 16px;
  /* 上下渐隐,滚出区边缘不做硬切 */
  mask-image: linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
}

.lyrics-line {
  margin: 0 0 16px;
  text-align: center;
  transition: opacity 0.22s var(--eno-ease), transform 0.22s var(--eno-ease);
}

.lyrics-main {
  margin: 0;
  color: var(--eno-text-3);
  font-family: var(--app-font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.55;
  transition: color 0.22s var(--eno-ease);
}

.lyrics-line--active {
  transform: scale(1.04);
}

.lyrics-line--active .lyrics-main {
  color: var(--eno-text-1);
  font-weight: 900;
}

.lyric-word {
  color: var(--eno-text-3);
  transition: color 0.12s linear;
}

.lyric-word--sung {
  color: var(--eno-text-2);
}

.lyric-word--now {
  color: var(--lp-seal-bright);
  font-weight: 900;
}

.lyrics-sub {
  margin: 5px 0 0;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 13px;
  line-height: 1.5;
}

.lyrics-line--active .lyrics-sub {
  color: var(--eno-text-2);
}

.lyrics-sub--romaji {
  font-style: italic;
  letter-spacing: 0.02em;
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
  opacity: calc(0.55 + var(--crowd, 0) * 0.35);
}

.crowd-chip {
  max-width: 148px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 3px 8px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-1);
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 11px;
}

.lyrics-hint {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 14px;
}

.lyrics-hint--error {
  flex-direction: column;
  gap: 12px;
}

.lyric-retry {
  height: 30px;
  padding: 0 18px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
  color: var(--lp-paper);
  font-family: var(--app-font-sans);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 0.16s var(--eno-ease-pop), background-color 0.16s var(--eno-ease);
}

.lyric-retry:hover {
  transform: translateY(-1px);
  background: var(--lp-seal-deep);
}

.lyric-retry:active {
  transform: translateY(1px);
}

/* —— 全屏视频分栏模式：右列歌词 —— */
.lyrics-panel--split {
  top: 0;
  right: 0;
  bottom: 104px;
  left: auto;
  width: 42%;
  max-width: none;
  height: auto;
  border: 0;
  border-left: 1px solid var(--eno-border);
  border-radius: 0;
  background: rgb(16 15 19 / 92%);
  box-shadow: none;
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
  line-height: 1.6;
}

.lyrics-panel--split .lyrics-line--active {
  transform: none;
}

.lyrics-panel--split .lyrics-line--active .lyrics-main {
  font-size: 27px;
}

.lyrics-panel--split .lyrics-sub {
  margin-top: 6px;
  font-size: 14px;
}

.lyrics-panel--split .lyrics-hint {
  color: var(--eno-text-3);
  font-size: 15px;
}

.lyrics-panel--split .crowd {
  max-height: 72px;
  padding: 0 20px 18px;
}

@media (prefers-reduced-motion: reduce) {
  .lyrics-line,
  .lyrics-main,
  .lyric-word,
  .lyric-toggle,
  .lyric-retry {
    transition: none;
    transform: none;
  }

  .lyrics-line--active {
    transform: none;
  }
}
</style>
