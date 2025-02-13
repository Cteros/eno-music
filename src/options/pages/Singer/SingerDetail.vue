<script setup>
import { useInfiniteScroll } from '@vueuse/core'

import SongItem from '~/options/components/SongItem.vue'
import { getUserArc } from '~/options/api'

import { useBlblStore } from '~/options/blbl/store.ts'
import { usePlaylistStore } from '~/options/playlist/store'
import Loading from '~/components/loading/index.vue'

const PLstore = usePlaylistStore()
const store = useBlblStore()

const info = computed(() => {
  return PLstore.singerCardCache[PLstore.currentSinger]
})

const songListByPage = ref({})
const renderList = computed(() => {
  return Object.values(songListByPage.value).flat()
})

const loading = ref(false)
const keyword = ref('')
const page = ref({
  pn: 1,
  ps: 25,
  count: 0,
})
const scrollRef = ref(null)

// 滚动加载
useInfiniteScroll(
  scrollRef,
  async () => {
    if (page.value.pn * page.value.ps >= page.value.count)
      return
    getSongs({ mid: PLstore.currentSinger, pn: page.value.pn + 1 })
  },
  { distance: 50 },
)

function getSongs(params) {
  loading.value = true
  getUserArc(params).then((res) => {
    const content = res.data
    const { page: c_page, list } = content
    const videoList = list.vlist.map(item => ({
      id: item.bvid,
      eno_song_type: 'bvid',
      cover: `${item.pic}`,
      title: item.title,
      description: item.description,
      author: item.author,
      duration: item.duration || 0, // 暂无
      bvid: item.bvid,
    }))
    page.value = c_page
    songListByPage.value[c_page.pn] = videoList
  }).finally(() => {
    loading.value = false
  })
}

watch(() => PLstore.currentSinger, (mid) => {
  PLstore.fetchSingerInfo(mid, false)
  songListByPage.value = {}
  getSongs({ mid })
})
function handlePlayUser() {
  store.playList = renderList.value
  store.play = renderList.value[0]
}
function startExportPoster() {
  PLstore.isShowPoster = true
  PLstore.posters = renderList.value.map(item => item.cover)
}
</script>

<template>
  <section class="h-screen singer-detail relative">
    <img
      :src="info?.face"
      class="w-full object-cover absolute top-0 left-0 opacity-10 -z-1"
    >
    <!-- 信息界面 -->
    <div class="singer-header relative">
      <div
        class="i-mingcute:square-arrow-left-line absolute top-3 left-3 text-4xl cursor-pointer hover:opacity-70 transition-opacity"
        @click.stop="store.mode = 'singerList'"
      />
      <div class="flex items-center gap-8">
        <img
          :src="info?.face"
          class="h-32 w-32 object-cover rounded-full border-3 border-white/30 shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-4">
            <h1 class="text-3xl font-bold">
              {{ info?.name }}
            </h1>
            <a
              :href="`https://space.bilibili.com/${PLstore.currentSinger}`"
              target="_blank"
              class="hover:opacity-70 transition-opacity"
            >
              <div class="i-mingcute:link-line w-5 h-5" />
            </a>
          </div>
          <div class="text-lg font-medium opacity-85">
            {{ info?.nameplate?.name }}
          </div>
          <div class="text-sm opacity-70">
            {{ info?.nameplate?.condition }}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="control-bar">
      <div class="flex items-center gap-6">
        <h2 class="text-lg font-bold">
          投稿作品
        </h2>
        <button
          class="play-all-btn"
          @click="handlePlayUser"
        >
          <div class="i-mingcute:play-fill mr-1" />
          播放全部
        </button>
        <div class="flex items-center gap-2 text-sm opacity-70">
          <span class="text-lg font-bold">{{ page.count }}</span>
          首歌曲
        </div>
        <button
          class="poster-btn"
          @click="startExportPoster"
        >
          <div class="i-mingcute:image-line mr-1" />
          制作歌单海报
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="search-wrapper">
        <div class="i-mingcute:search-line absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          v-model="keyword"
          placeholder="搜索歌曲"
          type="text"
          class="search-input"
          @keyup.enter="getSongs({ mid: PLstore.currentSinger, keyword })"
        >
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div ref="scrollRef" class="song-list">
      <div class="pb-30 flex flex-col gap-3">
        <SongItem v-for="song in renderList" :key="song.id" :song="song" />
      </div>
      <Loading v-if="loading && !renderList.length" />
    </div>
  </section>
</template>

<style scoped>
.singer-detail {
  display: grid;
  grid-template-rows: auto 64px 1fr;
}

.singer-header {
  @apply w-full px-10 pt-5 pb-0;
}

.control-bar {
  @apply w-full px-10 py-2 flex justify-between items-center border-b border-gray-800;
}

.play-all-btn {
  @apply flex items-center text-base font-bold bg-yellow/90 hover:bg-yellow px-4 py-2 rounded-full transition-colors;
}

.poster-btn {
  @apply flex items-center text-base font-medium px-4 py-2 rounded-full hover:bg-gray-100 transition-colors;
}

.search-wrapper {
  @apply relative;
}

.search-input {
  @apply w-48 h-10 pl-10 pr-4 rounded-full bg-gray-800/70 hover:bg-gray-800 focus:bg-gray-800
    transition-colors outline-none placeholder:text-sm;
}

.song-list {
  @apply h-full overflow-auto px-10;
}
</style>
