<script setup lang="ts">
import { cloneDeep } from 'lodash'
import { computed, onMounted } from 'vue'
import SingerItem from '~/features/singer/SingerItem.vue'
import SongItem from '~/shared/components/SongItem.vue'
import { useHomeStore, usePlayerStore, useRecentStore, useSingerStore, useUiStore } from '~/stores'
import RankOverview from './RankOverview.vue'

const home = useHomeStore()
const player = usePlayerStore()
const singerStore = useSingerStore()
const recent = useRecentStore()
const ui = useUiStore()

onMounted(() => {
  home.initHomePage()
})
function handlePlayRank() {
  player.playList = cloneDeep(home.musicRankList)
  player.play = home.musicRankList[0] || {}
}
function playContinue() {
  const list = cloneDeep(recent.playHistory)
  if (!list.length)
    return
  player.playList = list
  player.play = list[0]
}
function playRecent(song: any) {
  player.startPlay(song)
}
const mainSong = computed(() => home.musicRankList[0])
const recentSongs = computed(() => recent.playHistory.slice(0, 12))
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

    <div v-if="recentSongs.length" class="continue-block">
      <div class="continue-head">
        <h2 class="section-title continue-title">
          继续听
        </h2>
        <div class="continue-ops">
          <button type="button" class="text-btn" @click="ui.go('recent')">
            全部
          </button>
          <button type="button" class="text-btn" @click="playContinue">
            播放全部
          </button>
          <button type="button" class="text-btn" @click="recent.clearPlay()">
            清空
          </button>
        </div>
      </div>
      <div class="continue-row">
        <button
          v-for="song in recentSongs"
          :key="song.id || song.bvid"
          type="button"
          class="continue-card"
          @click="playRecent(song)"
        >
          <img :src="song.cover" :alt="song.title">
          <span class="continue-name">{{ song.title }}</span>
          <span class="continue-author">{{ song.author }}</span>
        </button>
      </div>
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

    <div class="continue-head artist-head">
      <h2 class="section-title continue-title">
        关注歌手
      </h2>
      <button type="button" class="text-btn" @click="ui.go('singerList')">
        全部
      </button>
    </div>
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
  background: transparent;
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
  transition: transform 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

.play-all:hover {
  transform: scale(1.06);
  background: #3be477;
}

.play-all:active {
  transform: scale(0.94);
  background: #1abc54;
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

.artist-head {
  margin: 24px 16px 8px;
}

.artist-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0 24px 40px;
}

.continue-block {
  padding: 8px 16px 16px;
}

.continue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 16px 12px;
}

.continue-title {
  margin: 0;
}

.continue-ops {
  display: flex;
  gap: 12px;
}

.text-btn {
  border: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: #b3b3b3;
  background: transparent;
  cursor: pointer;
}

.text-btn:hover {
  color: #fff;
}

.text-btn:active {
  transform: scale(0.96);
}

.continue-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 0 16px 8px;
}

.continue-card {
  display: flex;
  width: 148px;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  color: #fff;
  background: #181818;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), transform 0.18s var(--eno-ease);
}

.continue-card:hover {
  background: #282828;
  transform: translateY(-2px);
}

.continue-card:active {
  transform: translateY(0) scale(0.99);
}

.continue-card img {
  width: 124px;
  height: 124px;
  border-radius: 4px;
  object-fit: cover;
}

.continue-name,
.continue-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-name {
  font-size: 14px;
  font-weight: 700;
}

.continue-author {
  font-size: 12px;
  color: #b3b3b3;
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
