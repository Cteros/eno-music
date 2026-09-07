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
      <div class="recent-cover">
        <div class="i-tabler:history" />
      </div>
      <div>
        <div class="kicker">
          播放列表
        </div>
        <h1>最近播放</h1>
        <p>{{ recent.playHistory.length }} 首</p>
        <div class="recent-actions">
          <button class="play-all" type="button" @click.stop="playAll">
            <div class="i-tabler:player-play-filled" />
          </button>
          <button class="ghost" type="button" @click="recent.clearPlay()">
            清空全部
          </button>
        </div>
      </div>
    </header>
    <div class="recent-list">
      <div v-if="!recent.playHistory.length" class="empty">
        还没有播放记录
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
  background: linear-gradient(180deg, #1e3a5f 0%, #121212 42%);
}

.recent-hero {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 16px 32px 32px;
}

.recent-cover {
  display: flex;
  width: 192px;
  height: 192px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 80px;
  color: #fff;
  background: linear-gradient(135deg, #1e3a5f, #8ab4f8);
  box-shadow: 0 8px 24px rgb(0 0 0 / 50%);
}

.kicker {
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 8px 0 12px;
  font-size: 64px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
}

p {
  margin: 0;
  color: #b3b3b3;
}

.recent-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
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

.ghost {
  border: 0;
  background: transparent;
  color: #b3b3b3;
  font-weight: 700;
  cursor: pointer;
}

.ghost:hover {
  color: #fff;
}

.recent-list {
  padding: 8px 16px 40px;
}

.empty {
  padding: 24px 16px;
  color: #b3b3b3;
}

@media (max-width: 860px) {
  .recent-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }

  h1 {
    font-size: 36px;
  }

  .recent-cover {
    width: 148px;
    height: 148px;
  }
}
</style>
