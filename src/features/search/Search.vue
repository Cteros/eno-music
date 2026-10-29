<script setup lang="ts">
import { Loading, MessageAPI } from '@cloudfly/eno-ui'
import { useInfiniteScroll } from '@vueuse/core'

import { computed, ref } from 'vue'
import { useApiClient } from '~/api'
import AddCollection from '~/features/library/AddCollection.vue'
import SongItem from '~/shared/components/SongItem.vue'
import { zhError } from '~/shared/zhError'
import { useRecentStore } from '~/stores'

const scrollRef = ref(null)
const pageNum = ref(1)

const api = useApiClient()
const recent = useRecentStore()
const keyword = ref('')
const result = ref([] as any[])
const isLoading = ref(false)
const searchFailed = ref(false)
const enableScrollGetMore = ref(true)
const durationFilter = ref<'all' | 'short' | 'medium' | 'long'>('all')
const authorFilter = ref('')
const durationOptions = [
  { id: 'all', label: '全部时长' },
  { id: 'short', label: '5 分钟内' },
  { id: 'medium', label: '5–15 分钟' },
  { id: 'long', label: '15 分钟以上' },
] as const

function isUrl(url: string) {
  return /bilibili.com/.test(url)
}

function durationSeconds(input: unknown) {
  if (typeof input === 'number' && Number.isFinite(input))
    return input
  if (typeof input !== 'string')
    return 0
  if (input.includes(':')) {
    const parts = input.split(':').map(n => Number(n) || 0)
    if (parts.length === 3)
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2)
      return parts[0] * 60 + parts[1]
  }
  return Number(input) || 0
}

const displayed = computed(() => {
  const author = authorFilter.value.trim()
  return result.value.filter((item) => {
    if (author && !String(item.author || '').includes(author))
      return false
    const seconds = durationSeconds(item.duration)
    if (durationFilter.value === 'short')
      return seconds > 0 && seconds < 5 * 60
    if (durationFilter.value === 'medium')
      return seconds >= 5 * 60 && seconds <= 15 * 60
    if (durationFilter.value === 'long')
      return seconds > 15 * 60
    return true
  })
})

useInfiniteScroll(
  scrollRef,
  async () => {
    if (!enableScrollGetMore.value)
      return
    const moreData = await getMoreData()
    result.value = result.value.concat(moreData)
  },
  { distance: 10 },
)

async function getMoreData() {
  isLoading.value = true
  pageNum.value++
  try {
    const res = await api.blbl.search({
      keyword: keyword.value,
      page: pageNum.value,
    })
    return (res.data?.result || []).map((item) => {
      return {
        id: item.id || item.bvid,
        eno_song_type: 'bvid',
        cover: `http:${item.pic}`,
        title: item.title,
        description: item.description || item.desc,
        author: item.author || item.owner?.name || '未知',
        duration: item.duration,
        bvid: item.bvid,
        pages: item.pages,
        mid: item.mid,
      }
    })
  }
  catch (error) {
    enableScrollGetMore.value = false
    if (!result.value.length)
      searchFailed.value = true
    MessageAPI.show({
      type: 'error',
      message: zhError(error, '搜索失败，请稍后重试'),
    })
    return []
  }
  finally {
    isLoading.value = false
  }
}

async function handleSearch() {
  enableScrollGetMore.value = true
  const query = keyword.value.trim()
  if (!query)
    return
  searchFailed.value = false
  recent.recordSearch(query)
  try {
    if (isUrl(keyword.value)) {
      const matched = keyword.value.match(/BV([a-zA-Z0-9]+)/)
      if (!matched) {
        MessageAPI.show({ type: 'warning', message: '没有识别到 BV 号' })
        return
      }
      const bvid = matched[0]
      const item = await api.blbl.getVideoInfo({
        bvid,
      }).then(res => res.data)

      const searchSong = {
        id: item.id || item.bvid,
        eno_song_type: 'bvid',
        cover: item.pic,
        title: item.title,
        description: item.description || item.desc,
        author: item.author || item.owner?.name || '未知',
        duration: item.duration,
        bvid: item.bvid,
        pages: item.pages,
        mid: item.mid,
      }

      result.value = [searchSong]
      enableScrollGetMore.value = false
    }
    else {
      pageNum.value = 0
      result.value = []
      const newList = await getMoreData()
      result.value = newList
    }
  }
  catch (error) {
    searchFailed.value = true
    MessageAPI.show({
      type: 'error',
      message: zhError(error, '搜索失败，请稍后重试'),
    })
  }
}

function searchFromHistory(query: string) {
  keyword.value = query
  void handleSearch()
}
</script>

<template>
  <section class="search-page">
    <AddCollection />

    <header class="search-hero">
      <h1 class="search-title">
        搜索
      </h1>
      <div class="search-form">
        <div class="search-input-wrap">
          <div class="i-tabler:search search-input-icon" />
          <input
            id="search"
            v-model="keyword"
            type="text"
            class="search-input eno-input"
            placeholder="想听什么？"
            @keyup.enter="handleSearch"
          >
          <Loading v-if="isLoading" class="search-loading" />
        </div>
      </div>
      <div v-if="result.length" class="search-filters">
        <button
          v-for="item in durationOptions"
          :key="item.id"
          type="button"
          class="eno-chip"
          :class="{ 'eno-chip--on': durationFilter === item.id }"
          @click="durationFilter = item.id"
        >
          {{ item.label }}
        </button>
        <input
          v-model="authorFilter"
          class="author-filter eno-input"
          type="text"
          placeholder="按 UP 筛选"
        >
      </div>
    </header>

    <div v-if="displayed.length" ref="scrollRef" class="result-panel">
      <h2 class="result-title eno-section-title">
        歌曲
      </h2>
      <SongItem
        v-for="(item, index) in displayed"
        :key="item.bvid"
        :song="item"
        :index="index + 1"
        check-pages
      />
    </div>

    <div v-else-if="result.length" class="eno-empty">
      <h3 class="eno-empty__title">
        没有符合筛选的结果
      </h3>
      <p class="eno-empty__hint">
        试试改时长或 UP 名称。
      </p>
    </div>

    <div v-else-if="searchFailed" class="eno-empty">
      <h3 class="eno-empty__title">
        搜索失败
      </h3>
      <p class="eno-empty__hint">
        网络没通，歌没搜来。点「重试」再搜一次。
      </p>
      <button type="button" class="btn-primary" @click="handleSearch">
        <div class="i-tabler:rotate-clockwise" />
        重试
      </button>
    </div>

    <div v-else class="eno-empty">
      <h3 class="eno-empty__title">
        开始搜索
      </h3>
      <p class="eno-empty__hint">
        输入关键词，或直接粘贴 Bilibili 视频链接。
      </p>
      <div v-if="recent.searchHistory.length" class="history-block">
        <div class="history-head">
          <span>最近搜索</span>
          <button type="button" class="history-clear" @click="recent.clearSearch()">
            清空
          </button>
        </div>
        <div class="history-chips">
          <button
            v-for="item in recent.searchHistory"
            :key="item"
            type="button"
            class="eno-chip"
            @click="searchFromHistory(item)"
          >
            {{ item }}
            <span class="history-remove i-tabler:x" @click.stop="recent.removeSearch(item)" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

.search-hero {
  padding: 28px 32px 14px;
}

.search-title {
  margin: 0 0 18px;
  font-family: var(--app-font-display);
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.search-form {
  max-width: 480px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  color: var(--eno-text-3);
  font-size: 18px;
  pointer-events: none;
  transform: translateY(-50%);
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 42px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.search-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  max-width: 640px;
  margin-top: 14px;
}

.author-filter {
  height: 28px;
  min-width: 132px;
  padding: 0 10px;
  font-size: 12px;
}

.result-panel {
  flex: 1;
  overflow: auto;
  padding: 8px 24px 32px;
}

.result-title {
  margin: 18px 0 12px;
}

.history-block {
  width: min(440px, 100%);
  margin-top: 22px;
  text-align: left;
}

.history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--eno-text-3);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.history-clear {
  padding: 0 2px;
  border: 0;
  color: var(--eno-text-3);
  background: transparent;
  cursor: pointer;
}

.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-remove {
  font-size: 11px;
  opacity: 0.55;
  transition: color 0.16s var(--eno-ease), opacity 0.16s var(--eno-ease);
}

.history-remove:hover {
  color: var(--lp-seal-bright);
  opacity: 1;
}

@media (max-width: 860px) {
  .search-hero {
    padding: 20px 16px 10px;
  }

  .search-form {
    max-width: none;
  }

  .result-panel {
    padding: 8px 12px 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-remove {
    transition: none;
  }
}
</style>
