<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'

import { Loading } from '@cloudfly/eno-ui'
import SongItem from '~/shared/components/SongItem.vue'
import { getUserArc } from '~/api'

import { usePlayerStore, useSingerStore, useUiStore } from '~/stores'

const PLstore = useSingerStore()
const store = usePlayerStore()
const ui = useUiStore()

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
</script>

<template>
  <section class="singer-detail">
    <header class="singer-hero">
      <button class="back-btn" type="button" @click.stop="ui.mode = 'singerList'">
        <div class="i-mingcute:square-arrow-left-line" />
      </button>
      <img :src="info?.face" class="header-avatar" alt="">
      <div class="header-meta">
        <div class="kicker">
          艺人
        </div>
        <div class="title-row">
          <h1>{{ info?.name }}</h1>
          <a
            :href="`https://space.bilibili.com/${PLstore.currentSinger}`"
            target="_blank"
            class="external-link"
          >
            <div class="i-mingcute:link-line w-5 h-5" />
          </a>
        </div>
        <p class="header-badge">
          {{ info?.nameplate?.name }}
        </p>
        <p class="header-desc">
          {{ info?.nameplate?.condition }}
        </p>
      </div>
    </header>

    <div class="control-bar">
      <button class="play-all" type="button" @click="handlePlayUser">
        <div class="i-tabler:player-play-filled" />
      </button>
      <div class="count">
        {{ page.count }} 首歌曲
      </div>
      <div class="search-wrapper">
        <div class="i-mingcute:search-line search-icon" />
        <input
          v-model="keyword"
          placeholder="搜索歌曲"
          type="text"
          class="search-input"
          @keyup.enter="getSongs({ mid: PLstore.currentSinger, keyword })"
        >
      </div>
    </div>

    <div ref="scrollRef" class="song-list">
      <SongItem v-for="(song, index) in renderList" :key="song.id" :song="song" :index="index + 1" />
      <div v-if="loading && !renderList.length" class="loading-wrap">
        <Loading class="list-loading" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.singer-detail {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #3e3e3e 0%, #121212 280px);
}

.singer-hero {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 24px 32px 8px;
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  cursor: pointer;
}

.header-avatar {
  width: 192px;
  height: 192px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 24px rgb(0 0 0 / 50%);
}

.kicker {
  font-size: 13px;
  font-weight: 700;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

h1 {
  margin: 8px 0 12px;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
}

.external-link {
  color: #b3b3b3;
}

.external-link:hover {
  color: #fff;
}

.header-badge,
.header-desc {
  margin: 0 0 6px;
  color: #b3b3b3;
  font-size: 14px;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 32px 8px;
}

.play-all {
  display: inline-flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #000;
  background: #1ed760;
  font-size: 24px;
  cursor: pointer;
}

.play-all:hover {
  transform: scale(1.05);
}

.count {
  color: #b3b3b3;
  font-size: 14px;
}

.search-wrapper {
  position: relative;
  margin-left: auto;
  width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #b3b3b3;
}

.search-input {
  width: 100%;
  height: 36px;
  border: 0;
  border-radius: 999px;
  padding: 0 12px 0 36px;
  color: #fff;
  background: #242424;
}

.search-input:focus {
  outline: 1px solid #fff;
}

.song-list {
  flex: 1;
  overflow: auto;
  padding: 8px 16px 32px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

@media (max-width: 980px) {
  .singer-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 48px 16px 8px;
  }

  .header-avatar {
    width: 148px;
    height: 148px;
  }

  .search-wrapper {
    width: 100%;
    margin-left: 0;
  }
}
</style>
