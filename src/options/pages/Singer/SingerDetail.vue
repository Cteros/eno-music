<script setup>
import { useInfiniteScroll } from '@vueuse/core'

import { Loading } from '@cloudfly/eno-ui'
import SongItem from '~/options/components/SongItem.vue'
import { getUserArc } from '~/options/api'

import { useBlblStore } from '~/options/blbl/store.ts'
import { usePlaylistStore } from '~/options/playlist/store'

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
</script>

<template>
  <section class="h-screen singer-detail relative">
    <img
      :src="info?.face"
      class="w-full object-cover absolute top-0 left-0 opacity-8 -z-1"
    >
    <div class="detail-overlay" />

    <div class="singer-header relative">
      <div
        class="back-btn i-mingcute:square-arrow-left-line"
        @click.stop="store.mode = 'singerList'"
      />
      <div class="header-main">
        <img
          :src="info?.face"
          class="header-avatar"
        >
        <div class="header-meta">
          <div class="title-row">
            <h1 class="header-title">
              {{ info?.name }}
            </h1>
            <a
              :href="`https://space.bilibili.com/${PLstore.currentSinger}`"
              target="_blank"
              class="external-link"
            >
              <div class="i-mingcute:link-line w-5 h-5" />
            </a>
          </div>
          <div class="header-badge">
            {{ info?.nameplate?.name }}
          </div>
          <div class="header-desc">
            {{ info?.nameplate?.condition }}
          </div>
        </div>
      </div>
    </div>

    <div class="control-bar">
      <div class="control-left">
        <h2 class="section-title">
          投稿作品
        </h2>
        <button
          class="play-all-btn"
          @click="handlePlayUser"
        >
          <div class="i-mingcute:play-fill play-all-icon" />
          播放全部
        </button>
        <div class="flex items-center gap-2 text-sm opacity-70">
          <span class="text-lg font-bold">{{ page.count }}</span>
          首歌曲
        </div>
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
      <div class="song-list-inner pb-30 flex flex-col gap-2">
        <SongItem v-for="song in renderList" :key="song.id" :song="song" />
      </div>
      <div v-if="loading && !renderList.length" class="loading-wrap">
        <Loading class="list-loading" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.singer-detail {
  display: grid;
  grid-template-rows: auto auto 1fr;
  padding: 1.25rem 1.5rem 0;
  gap: 0.75rem;
}

.detail-overlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(120% 100% at 0% -20%, rgb(255 255 255 / 5%), transparent 55%),
    linear-gradient(180deg, rgb(8 9 10 / 62%) 0%, rgb(8 9 10 / 85%) 45%, rgb(8 9 10 / 96%) 100%);
}

.singer-header {
  position: relative;
  border: 1px solid var(--eno-border);
  border-radius: 16px;
  background: color-mix(in oklab, var(--eno-content), transparent 10%);
  backdrop-filter: blur(8px);
  padding: 1.1rem 1.2rem 1rem 3.1rem;
}

.back-btn {
  position: absolute;
  left: 1rem;
  top: 1rem;
  font-size: 1.3rem;
  color: var(--eno-text-2);
  cursor: pointer;
  transition: color 0.18s var(--eno-ease), transform 0.18s var(--eno-ease);
}

.back-btn:hover {
  color: var(--eno-text-1);
  transform: translateX(-1px);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-avatar {
  width: 72px;
  height: 72px;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 10%);
  border-radius: 999px;
  object-fit: cover;
}

.header-meta {
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.header-title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.external-link {
  display: inline-flex;
  color: var(--eno-text-3);
  transition: color 0.18s var(--eno-ease);
}

.external-link:hover {
  color: var(--eno-text-1);
}

.header-badge {
  margin-top: 0.45rem;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--eno-border);
  border-radius: 999px;
  padding: 0.16rem 0.62rem;
  font-size: 0.75rem;
  color: var(--eno-text-2);
  background: color-mix(in oklab, var(--eno-fill-1), transparent 6%);
}

.header-desc {
  margin-top: 0.45rem;
  max-width: 55rem;
  font-size: 0.82rem;
  color: var(--eno-text-3);
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--eno-border);
  border-radius: 14px;
  background: color-mix(in oklab, var(--eno-content), transparent 12%);
  padding: 0.7rem 0.95rem;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  margin-right: 0.1rem;
  font-size: 0.95rem;
  font-weight: 640;
  color: var(--eno-text-2);
}

.play-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.22rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 14%);
  border-radius: 11px;
  padding: 0 0.78rem;
  font-size: 0.86rem;
  font-weight: 630;
  color: var(--eno-text-1);
  background: linear-gradient(180deg, rgb(255 255 255 / 10%), rgb(255 255 255 / 3%));
  transition: border-color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.play-all-btn:hover {
  border-color: color-mix(in oklab, var(--eno-border), white 26%);
  background: linear-gradient(180deg, rgb(255 255 255 / 13%), rgb(255 255 255 / 4%));
  transform: translateY(-1px);
}

.play-all-icon {
  width: 1rem;
  height: 1rem;
  font-size: 1rem;
  color: var(--eno-text-2);
}

.search-wrapper {
  position: relative;
  width: 15rem;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 0.72rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  color: var(--eno-text-4);
}

.search-input {
  width: 100%;
  height: 2.15rem;
  padding: 0 0.8rem 0 2rem;
  border: 1px solid var(--eno-border);
  border-radius: 999px;
  font-size: 0.82rem;
  color: var(--eno-text-1);
  background: color-mix(in oklab, var(--eno-content), transparent 8%);
  transition: border-color 0.18s var(--eno-ease), background-color 0.18s var(--eno-ease);
}

.search-input::placeholder {
  color: var(--eno-text-4);
}

.search-input:hover {
  background: var(--eno-content-hover);
}

.search-input:focus {
  border-color: color-mix(in oklab, var(--eno-border), var(--eno-text-2) 28%);
  background: var(--eno-content-hover);
}

.song-list {
  height: 100%;
  overflow: auto;
  border: 1px solid var(--eno-border);
  border-radius: 14px 14px 0 0;
  background: color-mix(in oklab, var(--eno-bg), var(--eno-content) 18%);
  padding: 0.7rem;
}

.song-list-inner {
  min-height: 100%;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding-top: 1.2rem;
}

.list-loading {
  transform: scale(1.25);
}

@media (max-width: 980px) {
  .singer-detail {
    padding: 0.9rem 0.75rem 0;
  }

  .control-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }
}
</style>
