<script setup lang="ts">
import { ref } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'

import { Loading } from '@cloudfly/eno-ui'
import AddCollection from '~/features/library/AddCollection.vue'
import SongItem from '~/shared/components/SongItem.vue'
import { useApiClient } from '~/api'

const scrollRef = ref(null)
const pageNum = ref(1)

const api = useApiClient()
const keyword = ref('')
const result = ref([])
const isLoading = ref(false)
const enableScrollGetMore = ref(true)

function isUrl(url) {
  return /bilibili.com/.test(url)
}

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

async function handleSearch() {
  enableScrollGetMore.value = true
  if (isUrl(keyword.value)) {
    const bvid = keyword.value.match(/BV([a-zA-Z0-9]+)/)[0]
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
        搜索
      </h1>
      <div class="search-form">
        <div class="search-input-wrap">
          <div class="i-tabler:search search-input-icon" />
          <input
            id="search"
            v-model="keyword"
            type="text"
            class="search-input"
            placeholder="想听什么？"
            @keyup.enter="handleSearch"
          >
          <Loading v-if="isLoading" class="search-loading" />
        </div>
      </div>
    </header>

    <div v-if="result.length" ref="scrollRef" class="result-panel">
      <h2 class="result-title">
        歌曲
      </h2>
      <SongItem
        v-for="(item, index) in result"
        :key="item.bvid"
        :song="item"
        :index="index + 1"
        check-pages
      />
    </div>

    <div v-else class="empty-panel">
      <h3>开始搜索</h3>
      <p>输入关键词，或直接粘贴 Bilibili 视频链接。</p>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background:
    linear-gradient(180deg, #1e1e1e 0%, #121212 220px);
}

.search-hero {
  padding: 24px 32px 8px;
}

.search-title {
  margin: 0 0 20px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.search-form {
  max-width: 364px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.search-input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #000;
}

.search-input {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 24px;
  padding: 0 16px 0 44px;
  font-size: 14px;
  font-weight: 600;
  color: #000;
  background: #fff;
}

.search-input::placeholder {
  color: #757575;
}

.search-input:focus {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.result-panel {
  flex: 1;
  overflow: auto;
  padding: 8px 16px 32px;
}

.result-title {
  margin: 8px 16px 12px;
  font-size: 24px;
  font-weight: 700;
}

.empty-panel {
  padding: 48px 32px;
  color: #b3b3b3;
}

.empty-panel h3 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.empty-panel p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 860px) {
  .search-hero {
    padding: 20px 16px 8px;
  }

  .search-form {
    max-width: none;
  }
}
</style>
