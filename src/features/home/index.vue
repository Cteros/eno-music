<script setup lang="ts">
import { MessageAPI } from '@cloudfly/eno-ui'
import { cloneDeep } from 'lodash'
import { computed, onMounted, ref } from 'vue'
import SingerItem from '~/features/singer/SingerItem.vue'
import SongItem from '~/shared/components/SongItem.vue'
import { fetchHourlyRadio } from '~/shared/fetchHourlyRadio'
import { useHomeStore, usePlayerStore, useRecentStore, useSingerStore, useUiStore } from '~/stores'
import RankOverview from './RankOverview.vue'

const home = useHomeStore()
const player = usePlayerStore()
const singerStore = useSingerStore()
const recent = useRecentStore()
const ui = useUiStore()

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

const radioBusy = ref(false)

onMounted(() => {
  home.initHomePage()
  singerStore.fetchSingerInfoList()
})

async function playHourlyRadio() {
  if (radioBusy.value)
    return
  const mids = singerStore.singers
  if (!mids.length) {
    MessageAPI.show({ type: 'warning', message: '先添加关注的音乐人' })
    ui.go('singerList')
    return
  }
  radioBusy.value = true
  try {
    const tracks = await fetchHourlyRadio(mids)
    if (!tracks.length) {
      MessageAPI.show({ type: 'warning', message: '关注的人最近没有合适长度的稿' })
      return
    }
    player.playAlbum(tracks)
    const minutes = Math.round(tracks.reduce((sum, track) => sum + (Number(track.duration) || 0), 0) / 60)
    MessageAPI.show({ type: 'success', message: `今晚的台 · ${tracks.length} 首 · 约 ${minutes} 分钟` })
  }
  catch (error) {
    console.warn('[radio]', error)
    MessageAPI.show({ type: 'error', message: '编台失败，稍后再试' })
  }
  finally {
    radioBusy.value = false
  }
}
const mainSong = computed(() => home.musicRankList[0])
const recentSongs = computed(() => recent.playHistory.slice(0, 12))
</script>

<template>
  <section class="home-page">
    <header v-if="mainSong" class="home-hero">
      <div class="hero-meta">
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
      <div class="hero-spine" aria-hidden="true">
        BILIBILI 音乐榜
      </div>
      <img class="hero-cover" :src="mainSong.cover" alt="">
    </header>

    <div v-if="mainSong" class="home-actions">
      <button class="btn-primary" type="button" @click="handlePlayRank">
        <div class="i-tabler:player-play-filled" />
        播放全部
      </button>
      <button class="btn" type="button" :disabled="radioBusy" @click="playHourlyRadio">
        <div class="i-tabler:radio" />
        {{ radioBusy ? '编台中…' : '关注电台' }}
      </button>
    </div>

    <div v-if="mainSong" class="track-table">
      <div class="track-head">
        <span class="col-title">曲 目 表</span>
        <span class="col-meta">{{ home.musicRankList.length }} 首</span>
      </div>
      <SongItem
        v-for="(song, index) in home.musicRankList"
        :key="song.id"
        :song="song"
        :index="index + 1"
      />
    </div>

    <div v-else class="home-skeleton">
      <div v-for="n in 6" :key="n" class="skeleton-row">
        <div class="eno-skeleton skeleton-rank" />
        <div class="eno-skeleton skeleton-cover" />
        <div class="skeleton-lines">
          <div class="eno-skeleton skeleton-title" />
          <div class="eno-skeleton skeleton-sub" />
        </div>
      </div>
    </div>

    <div v-if="recentSongs.length" class="continue-block">
      <div class="continue-head">
        <h2 class="continue-title">
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

    <div class="artist-block">
      <div class="continue-head artist-head">
        <h2 class="continue-title">
          关注歌手
        </h2>
        <div class="continue-ops">
          <button
            type="button"
            class="text-btn"
            :disabled="radioBusy"
            @click="playHourlyRadio"
          >
            {{ radioBusy ? '编台中…' : '开一台' }}
          </button>
          <button type="button" class="text-btn" @click="ui.go('singerList')">
            全部
          </button>
        </div>
      </div>
      <div class="artist-row">
        <SingerItem v-for="serid in singerStore.singers" :key="serid" :singer-mid="serid" can-del />
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-page {
  height: 100%;
  overflow: auto;
  padding: 26px 48px 32px;
  background: transparent;
}

/* —— 报头：大字标题 + 封套小图 —— */
.home-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--eno-border);
}

.hero-meta {
  min-width: 0;
}

.hero-title {
  margin: 0;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: clamp(38px, 4.4vw, 54px);
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.12;
  text-wrap: balance;
}

.hero-sub {
  margin: 10px 0 0;
  color: var(--eno-text-3);
  font-size: 14px;
  letter-spacing: 0.06em;
}

.hero-tools {
  margin-top: 14px;
}

/* 竖排刊头条：世界构件（书脊式竖排） */
.hero-spine {
  align-self: stretch;
  display: flex;
  align-items: center;
  margin: 2px 18px 2px 0;
  padding-left: 12px;
  border-left: 1px solid var(--eno-border);
  color: var(--eno-text-3);
  font-family: var(--app-font-display);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.42em;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
}

.hero-cover {
  width: 176px;
  height: 176px;
  flex-shrink: 0;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
  box-shadow: var(--eno-shadow-md);
}

.home-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 0 4px;
}

/* —— 曲目表：双线栏头 + 内页行 —— */
.track-table {
  padding-top: 12px;
}

.track-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
  padding-bottom: 8px;
  border-bottom: 3px double rgb(240 235 221 / 38%);
}

.col-title {
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0.28em;
}

.col-meta {
  margin-left: auto;
  color: var(--eno-text-3);
  font-size: 12px;
  letter-spacing: 0.12em;
}

.home-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0 24px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 48px 44px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  height: 64px;
  padding: 0 12px;
}

.skeleton-rank {
  width: 28px;
  height: 24px;
}

.skeleton-cover {
  width: 44px;
  height: 44px;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  width: 38%;
  height: 16px;
}

.skeleton-sub {
  width: 22%;
  height: 11px;
}

/* —— 继续听 / 关注歌手 —— */
.continue-block,
.artist-block {
  padding-top: 36px;
}

.continue-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 3px double rgb(240 235 221 / 38%);
}

.continue-title {
  margin: 0;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.continue-ops {
  display: flex;
  gap: 16px;
  margin-left: auto;
}

.text-btn {
  padding: 0;
  border: 0;
  color: var(--eno-text-3);
  background: transparent;
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease);
}

.text-btn:hover {
  color: var(--eno-text-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.text-btn:disabled {
  cursor: default;
  opacity: 0.45;
}

.continue-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 20px;
  padding: 18px 0 4px;
}

.continue-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  border: 0;
  color: var(--eno-text-1);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.continue-card img {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
  transition: transform 0.18s var(--eno-ease), box-shadow 0.18s var(--eno-ease), border-color 0.18s var(--eno-ease);
}

.continue-card:hover img {
  transform: translateY(-2px);
  border-color: rgb(240 235 221 / 26%);
  box-shadow: var(--eno-shadow-md);
}

.continue-card:hover .continue-name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.continue-card:active img {
  transform: translateY(0);
  box-shadow: none;
}

.continue-name,
.continue-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-name {
  font-family: var(--app-font-display);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.continue-author {
  color: var(--eno-text-3);
  font-size: 12px;
}

.artist-row {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 8px 0 40px;
}

.artist-row :deep(.song-item) {
  border-radius: 0;
}

.track-table :deep(.song-item) {
  border-bottom: 1px solid var(--eno-border);
  border-radius: 0;
}

@media (max-width: 860px) {
  .home-page {
    padding: 20px 18px 28px;
  }

  .home-hero {
    flex-direction: column-reverse;
    align-items: flex-start;
    gap: 18px;
  }

  .hero-spine {
    display: none;
  }

  .hero-cover {
    width: 132px;
    height: 132px;
  }

  .hero-title {
    font-size: 34px;
  }
}
</style>
