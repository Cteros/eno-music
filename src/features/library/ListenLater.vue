<script setup lang="ts">
import { cloneDeep } from 'lodash'
import SongItem from '~/shared/components/SongItem.vue'
import { useLibraryStore, usePlayerStore } from '~/stores'

const PLStore = useLibraryStore()
const store = usePlayerStore()

onMounted(() => {
  if (!PLStore.listenLater.length)
    PLStore.listenLater = []
})
function handlePlayLater() {
  if (!PLStore.listenLater.length)
    return
  const playlist = cloneDeep(PLStore.listenLater)
  store.play = playlist[0]
  store.playList = playlist
}
function handleRemoveListenLater(song) {
  PLStore.listenLater = PLStore.listenLater.filter(item => item.id !== song.id)
}
</script>

<template>
  <div class="later-page">
    <header class="later-hero">
      <div class="later-cover">
        <div class="i-mingcute:bookmark-fill" />
      </div>
      <div>
        <div class="kicker">
          播放列表
        </div>
        <h1>稍后播放</h1>
        <p>{{ PLStore.listenLater?.length || 0 }} 首</p>
        <div class="later-actions">
          <button class="play-all" type="button" @click.stop="handlePlayLater">
            <div class="i-tabler:player-play-filled" />
          </button>
          <button class="ghost" type="button" @click="PLStore.listenLater = []">
            清空全部
          </button>
        </div>
      </div>
    </header>
    <div class="later-list">
      <div v-if="!PLStore.listenLater.length" class="empty">
        暂无数据
      </div>
      <SongItem
        v-for="(item, index) in PLStore.listenLater"
        :key="item.id"
        :song="item"
        :index="index + 1"
        :del="true"
        :later="false"
        @delete-song="handleRemoveListenLater(item)"
      />
    </div>
  </div>
</template>

<style scoped>
.later-page {
  height: 100%;
  overflow: auto;
  background: linear-gradient(180deg, #5038a0 0%, #121212 42%);
}

.later-hero {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 32px;
}

.later-cover {
  display: flex;
  width: 192px;
  height: 192px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 80px;
  color: #fff;
  background: linear-gradient(135deg, #450af5, #c4efd9);
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

.later-actions {
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

.later-list {
  padding: 8px 16px 40px;
}

.empty {
  padding: 24px 16px;
  color: #b3b3b3;
}

@media (max-width: 860px) {
  .later-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 16px;
  }

  h1 {
    font-size: 36px;
  }

  .later-cover {
    width: 148px;
    height: 148px;
  }
}
</style>
