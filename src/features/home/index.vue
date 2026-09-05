<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cloneDeep } from 'lodash'
import RankOverview from './RankOverview.vue'
import SingerItem from '~/features/singer/SingerItem.vue'
import SongItem from '~/shared/components/SongItem.vue'
import { useHomeStore, usePlayerStore, useSingerStore } from '~/stores'

const home = useHomeStore()
const player = usePlayerStore()
const singerStore = useSingerStore()

onMounted(() => {
  home.initHomePage()
})
function handlePlayRank() {
  player.playList = cloneDeep(home.musicRankList)
  player.play = home.musicRankList[0] || {}
}
const mainSong = computed(() => {
  return home.musicRankList[0]
})
</script>

<template>
  <section class="home-page">
    <header v-if="mainSong" class="home-hero">
      <img class="hero-cover" :src="mainSong.cover" alt="">
      <div class="hero-meta">
        <div class="hero-kicker">
          公开歌单
        </div>
        <h1 class="hero-title">
          bilibili 音乐榜
        </h1>
        <p class="hero-sub">
          每周五 18:00 更新 · {{ home.musicRankList.length }} 首
        </p>
        <div class="hero-tools">
          <RankOverview />
        </div>
      </div>
    </header>

    <div v-if="mainSong" class="home-actions">
      <button class="play-all" type="button" title="播放全部" @click="handlePlayRank">
        <div class="i-tabler:player-play-filled play-all-icon" />
      </button>
    </div>

    <div v-if="mainSong" class="track-table">
      <div class="track-head">
        <span class="col-index">#</span>
        <span>标题</span>
      </div>
      <SongItem
        v-for="(song, index) in home.musicRankList"
        :key="song.id"
        :song="song"
        :index="index + 1"
      />
    </div>

    <div v-else class="home-loading">
      <div class="i-mingcute:loading-line animate-spin text-4xl mx-auto mb-4" />
      <div>加载中...</div>
    </div>

    <h2 class="section-title">
      关注歌手
    </h2>
    <div class="artist-row">
      <SingerItem v-for="serid in singerStore.singers" :key="serid" :singer-mid="serid" can-del />
    </div>
  </section>
</template>

<style scoped>
.home-page {
  height: 100%;
  overflow: auto;
  padding-bottom: 24px;
  background:
    linear-gradient(180deg, #3e3e3e 0%, #121212 42%);
}

.home-hero {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  min-height: 280px;
  padding: 24px 32px 8px;
}

.hero-cover {
  width: 232px;
  height: 232px;
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 8px 24px rgb(0 0 0 / 50%);
}

.hero-kicker {
  font-size: 13px;
  font-weight: 700;
}

.hero-title {
  margin: 8px 0 12px;
  font-size: clamp(48px, 6vw, 72px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
}

.hero-sub {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
}

.hero-tools {
  margin-top: 12px;
}

.home-actions {
  display: flex;
  align-items: center;
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
  cursor: pointer;
  transition: transform 0.12s var(--eno-ease), background-color 0.12s var(--eno-ease);
}

.play-all:hover {
  transform: scale(1.05);
  background: #3be477;
}

.play-all-icon {
  width: 24px;
  height: 24px;
  font-size: 24px;
}

.track-table {
  padding: 0 16px 8px;
}

.track-head {
  display: grid;
  grid-template-columns: 48px 1fr;
  align-items: center;
  height: 36px;
  margin: 0 16px 8px;
  padding: 0 16px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
  color: #b3b3b3;
  font-size: 13px;
}

.col-index {
  text-align: center;
}

.home-loading {
  padding: 80px 32px;
  text-align: center;
  color: #b3b3b3;
}

.section-title {
  margin: 24px 32px 16px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.artist-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0 24px 40px;
}

@media (max-width: 860px) {
  .home-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 16px 8px;
  }

  .hero-cover {
    width: 148px;
    height: 148px;
  }

  .hero-title {
    font-size: 36px;
  }
}
</style>
