<script setup>
import { ref } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import cn from 'classnames'

import AddCollection from '~/options/playlist/AddCollection.vue'
import SongItem from '~/options/components/SongItem.vue'
import { useApiClient } from '~/composables/api'
import Loading from '~/components/loading/index.vue'

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
  <section w-full h-screen overflow-auto flex flex-col px-20 relative pt-10>
    <AddCollection />
    <div class="w-[35vw] relative flex gap-3" color="$eno-text-1">
      <input
        id="search" v-model="keyword" type="text" bg="$eno-content focus:$eno-content-hover"
        :class="cn('w-full px-8 py-2 h-12 eno-input text-lg')" placeholder="关键字 或 原视频链接" @keyup.enter="handleSearch"
      >
      <div
        absolute right-5 text-xl class="i-tabler:search w-1em h-1em top-[50%] translate-y--1/2"
        @click="handleSearch"
      />
      <Loading v-if="isLoading" />
    </div>
    <!-- 搜索结果 -->
    <div v-if="result.length" ref="scrollRef" class="h-[calc(100vh-10rem)]" w-full overflow-auto mt-4 px-20 pb-30>
      <SongItem v-for="item in result" :key="item.bvid" :song="item" check-pages />
    </div>
    <!-- 搜索指南 -->
    <div v-else class="w-full text-lg pt-10">
      <ul>
        <ol>
          1. 输入关键字
        </ol>
        <ol>
          2. 输入原视频链接
        </ol>
        <ol>
          2. 分 P 视频可以直接保存成 eno 歌单
        </ol>
      </ul>
    </div>
  </section>
</template>
