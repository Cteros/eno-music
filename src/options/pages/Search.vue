<script setup>
import { ref } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'

import { Loading } from '@cloudfly/eno-ui'
import AddCollection from '~/options/playlist/AddCollection.vue'
import SongItem from '~/options/components/SongItem.vue'
import { useApiClient } from '~/composables/api'

const scrollRef = ref(null)
const pageNum = ref(1)

const api = useApiClient()
const keyword = ref('')
const result = ref([])
const isLoading = ref(false)
// 单个搜索结果过少时不触发滚动加载
const enableScrollGetMore = ref(true)

function isUrl(url) {
  return /bilibili.com/.test(url)
}
// 滚动加载
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
// 加载函数
async function getMoreData() {
  isLoading.value = true
  pageNum.value++
  const res = await api.blbl.search({
    keyword: keyword.value,
    page: pageNum.value,
  })
  isLoading.value = false

  return res.data.result.map((item) => {
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
// 搜索
async function handleSearch() {
  enableScrollGetMore.value = true
  if (isUrl(keyword.value)) {
    const bvid = keyword.value.match(/BV([a-zA-Z0-9]+)/)[0]
    // 获取对应的歌曲
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
</script>

<template>
  <section class="search-page">
    <AddCollection />

    <header class="search-hero">
      <h1 class="search-title">
        搜索音乐
      </h1>
      <p class="search-subtitle">
        输入关键词或 Bilibili 视频链接，快速加入播放列表。
      </p>

      <div class="search-form">
        <div class="search-input-wrap">
          <div class="i-tabler:search search-input-icon" />
          <input
            id="search"
            v-model="keyword"
            type="text"
            class="search-input"
            placeholder="输入关键词或原视频链接"
            @keyup.enter="handleSearch"
          >
          <Loading v-if="isLoading" class="search-loading" />
        </div>
        <button class="search-btn" @click="handleSearch">
          搜索
        </button>
      </div>
    </header>

    <div class="result-meta">
      <span>结果</span>
      <span class="result-count">{{ result.length }}</span>
    </div>

    <div v-if="result.length" ref="scrollRef" class="result-panel">
      <SongItem v-for="item in result" :key="item.bvid" :song="item" check-pages />
    </div>

    <div v-else class="empty-panel">
      <div class="i-tabler:music-search empty-icon" />
      <h3>开始搜索</h3>
      <ol class="empty-steps">
        <li>输入关键词</li>
        <li>或直接粘贴原视频链接</li>
        <li>分 P 视频支持直接保存成歌单</li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  position: relative;
  display: flex;
  height: 100vh;
  flex-direction: column;
  gap: 0.85rem;
  overflow: hidden;
  padding: 1.15rem 1.5rem 5.5rem;
}

.search-hero {
  border: 1px solid var(--eno-border);
  border-radius: 16px;
  padding: 1.1rem 1.1rem 1rem;
  background:
    radial-gradient(120% 100% at 0% -20%, rgb(255 255 255 / 5%), transparent 52%),
    color-mix(in oklab, var(--eno-content), transparent 6%);
}

.search-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--eno-text-1);
}

.search-subtitle {
  margin: 0.3rem 0 0.88rem;
  font-size: 0.86rem;
  color: var(--eno-text-3);
}

.search-form {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 0.66rem;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-loading {
  position: absolute;
  right: 0.72rem;
  top: 50%;
  transform: translateY(-50%);
}

.search-input-icon {
  position: absolute;
  left: 0.72rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.96rem;
  color: var(--eno-text-4);
}

.search-input {
  width: 100%;
  height: 2.5rem;
  border: 1px solid var(--eno-border);
  border-radius: 11px;
  padding: 0 0.82rem 0 2rem;
  font-size: 0.92rem;
  color: var(--eno-text-1);
  background: color-mix(in oklab, var(--eno-content), transparent 8%);
  transition: background-color 0.16s var(--eno-ease), border-color 0.16s var(--eno-ease);
}

.search-input::placeholder {
  color: var(--eno-text-4);
}

.search-input:hover {
  background: var(--eno-content-hover);
}

.search-input:focus {
  border-color: color-mix(in oklab, var(--eno-border), white 20%);
  background: var(--eno-content-hover);
}

.search-btn {
  height: 2.5rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 10%);
  border-radius: 11px;
  padding: 0 1rem;
  font-size: 0.9rem;
  font-weight: 620;
  color: var(--eno-text-1);
  background: linear-gradient(180deg, rgb(255 255 255 / 7%), rgb(255 255 255 / 2%));
  cursor: pointer;
  transition: border-color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

.search-btn:hover {
  border-color: color-mix(in oklab, var(--eno-border), white 24%);
  background: linear-gradient(180deg, rgb(255 255 255 / 10%), rgb(255 255 255 / 3%));
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.36rem;
  padding: 0 0.2rem;
  font-size: 0.84rem;
  color: var(--eno-text-3);
}

.result-count {
  border: 1px solid var(--eno-border);
  border-radius: 999px;
  padding: 0.06rem 0.44rem;
  color: var(--eno-text-2);
  background: color-mix(in oklab, var(--eno-fill-1), transparent 8%);
}

.result-panel {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--eno-border);
  border-radius: 14px;
  background: color-mix(in oklab, var(--eno-bg), var(--eno-content) 16%);
  padding: 0.62rem;
}

.empty-panel {
  flex: 1;
  border: 1px dashed color-mix(in oklab, var(--eno-border), white 12%);
  border-radius: 14px;
  padding: 2rem 1.25rem;
  color: var(--eno-text-3);
  background: color-mix(in oklab, var(--eno-content), transparent 18%);
}

.empty-icon {
  font-size: 1.6rem;
  margin-bottom: 0.55rem;
  color: var(--eno-text-2);
}

.empty-panel h3 {
  margin: 0 0 0.45rem;
  font-size: 1.06rem;
  font-weight: 650;
  color: var(--eno-text-1);
}

.empty-steps {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.35rem;
  font-size: 0.88rem;
}

@media (max-width: 860px) {
  .search-page {
    padding: 0.9rem 0.9rem 5.5rem;
  }

  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
