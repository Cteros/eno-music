<script setup lang="ts">
import { Loading } from '@cloudfly/eno-ui'

import { useInfiniteScroll } from '@vueuse/core'
import { getUserArc } from '~/api'
import SongItem from '~/shared/components/SongItem.vue'

import { usePlayerStore, useSingerStore } from '~/stores'

const PLstore = useSingerStore()
const store = usePlayerStore()

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
      <img :src="info?.face" class="header-avatar" alt="">
      <div class="header-meta">
        <div class="title-row">
          <h1 class="singer-title">
            {{ info?.name }}
          </h1>
          <a
            :href="`https://space.bilibili.com/${PLstore.currentSinger}`"
            target="_blank"
            class="external-link"
            title="在 B 站查看"
          >
            <div class="i-tabler:link" />
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
      <button class="play-all" type="button" title="播放全部" @click="handlePlayUser">
        <div class="i-tabler:player-play-filled" />
      </button>
      <div class="count">
        {{ page.count }} 首歌曲
      </div>
      <div class="search-wrapper">
        <div class="i-tabler:search search-icon" />
        <input
          v-model="keyword"
          placeholder="搜索歌曲"
          type="text"
          class="eno-input search-input"
          @keyup.enter="getSongs({ mid: PLstore.currentSinger, keyword })"
        >
      </div>
    </div>

    <div ref="scrollRef" class="song-list">
      <SongItem v-for="(song, index) in renderList" :key="song.id" :song="song" :index="index + 1" />
      <div v-if="loading && !renderList.length" class="loading-wrap">
        <Loading class="list-loading" />
      </div>
      <div v-if="!loading && !renderList.length" class="eno-empty">
        <div class="eno-empty__icon">
          <div class="i-tabler:search" />
        </div>
        <div class="eno-empty__title">
          没有找到歌曲
        </div>
        <div class="eno-empty__hint">
          换个关键词，再搜一次
        </div>
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
}

.singer-hero {
  display: flex;
  align-items: flex-end;
  gap: 28px;
  padding: 28px 32px 12px;
}

.header-avatar {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-lg);
  object-fit: cover;
  box-shadow: var(--eno-shadow-md);
}

.header-meta {
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.singer-title {
  margin: 0;
  overflow-wrap: anywhere;
  font-family: var(--app-font-display);
  font-size: clamp(30px, 4.4vw, 52px);
  font-weight: 900;
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.external-link {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--eno-text-3);
  font-size: 20px;
  transition: color 0.16s var(--eno-ease);
}

.external-link:hover {
  color: var(--eno-text-1);
}

.header-badge {
  margin: 12px 0 0;
  color: var(--eno-text-2);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.header-desc {
  margin: 4px 0 0;
  color: var(--eno-text-3);
  font-size: 13px;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 32px 10px;
}

.play-all {
  display: inline-flex;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: var(--lp-paper);
  background: var(--eno-primary);
  font-size: 22px;
  cursor: pointer;
}

.play-all:hover {
  background: var(--eno-primary-hover);
  transform: translateY(-1px);
}

.play-all:active {
  transform: translateY(1px);
}

.count {
  color: var(--eno-text-3);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.search-wrapper {
  position: relative;
  width: 240px;
  margin-left: auto;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  color: var(--eno-text-3);
  font-size: 16px;
  pointer-events: none;
  transform: translateY(-50%);
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 38px;
}

.song-list {
  flex: 1;
  overflow: auto;
  padding: 0 32px 32px;
}

.song-list :deep(.song-item) {
  border-bottom: 1px solid var(--eno-border);
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
    padding: 20px 16px 8px;
  }

  .header-avatar {
    width: 132px;
    height: 132px;
  }

  .control-bar {
    flex-wrap: wrap;
    padding: 16px 16px 8px;
  }

  .search-wrapper {
    width: 100%;
    margin-left: 0;
  }

  .song-list {
    padding-right: 16px;
    padding-left: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .external-link {
    transition: none;
  }
}
</style>
