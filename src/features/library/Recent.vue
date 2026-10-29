<script setup lang="ts">
import { cloneDeep } from 'lodash'
import SongItem from '~/shared/components/SongItem.vue'
import { usePlayerStore, useRecentStore } from '~/stores'

const recent = useRecentStore()
const player = usePlayerStore()

function playAll() {
  if (!recent.playHistory.length)
    return
  const playlist = cloneDeep(recent.playHistory)
  player.playList = playlist
  player.play = playlist[0]
}
</script>

<template>
  <div class="recent-page">
    <header class="recent-hero">
      <div class="recent-head">
        <div class="recent-title-row">
          <h1 class="recent-title">
            最近播放
          </h1>
          <span class="eno-seal eno-seal--round">已听</span>
        </div>
        <p class="recent-count">
          {{ recent.playHistory.length }} 首
        </p>
      </div>
      <div class="recent-actions">
        <button class="play-all" type="button" title="播放全部" @click.stop="playAll">
          <div class="i-tabler:player-play-filled" />
        </button>
        <button class="ghost" type="button" title="清空记录" @click="recent.clearPlay()">
          清空全部
        </button>
      </div>
    </header>
    <div class="recent-list">
      <div v-if="!recent.playHistory.length" class="eno-empty">
        <div class="eno-empty__icon">
          <div class="i-tabler:history" />
        </div>
        <div class="eno-empty__title">
          还没有播放记录
        </div>
        <div class="eno-empty__hint">
          听过的歌都会记在这一页
        </div>
      </div>
      <SongItem
        v-for="(item, index) in recent.playHistory"
        :key="item.id || item.bvid"
        :song="item"
        :index="index + 1"
        :del="true"
        :later="true"
        @delete-song="recent.removePlay(item)"
      />
    </div>
  </div>
</template>

<style scoped>
.recent-page {
  height: 100%;
  overflow: auto;
  padding: 28px 32px 40px;
}

.recent-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.recent-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.recent-title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.15;
}

.recent-count {
  margin: 10px 0 0;
  color: var(--eno-text-3);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.recent-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding-bottom: 4px;
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

.ghost {
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--eno-radius-md);
  color: var(--eno-text-2);
  background: transparent;
  font-family: var(--app-font-sans);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.ghost:hover {
  color: var(--eno-text-1);
  background: var(--eno-fill-1);
}

.ghost:active {
  transform: scale(0.97);
}

.recent-list {
  margin-top: 24px;
}

.recent-list :deep(.song-item) {
  border-bottom: 1px solid var(--eno-border);
}

@media (max-width: 860px) {
  .recent-page {
    padding: 20px 16px 32px;
  }

  .recent-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .recent-actions {
    padding-bottom: 0;
  }
}
</style>
