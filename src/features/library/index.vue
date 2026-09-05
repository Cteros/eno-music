<script setup lang="ts">
import { computed } from 'vue'
import { Dialog } from '@cloudfly/eno-ui'

import ImpFav from './ImportFav.vue'
import BLFav from './BiliFav.vue'
import SongItem from '~/shared/components/SongItem.vue'
import { getCollectedFavorites, getFavorites } from '~/api'
import { useLibraryStore, usePlayerStore } from '~/stores'

const userInfo = inject('userInfo')
const store = usePlayerStore()
const PLStore = useLibraryStore()
const list = PLStore.list
const noPlaylist = computed(() => list?.length === 0)
// bilibili 里面的 收藏夹
const favs = ref([])
const collectedFavs = ref([])
const normalizedFavs = computed(() => favs.value.map((item) => {
  return {
    ...item,
    id: item.id || item.media_id || item.fid,
    title: item.title || item.name || '未命名收藏夹',
  }
}))
const normalizedCollectedFavs = computed(() => collectedFavs.value.map((item) => {
  return {
    ...item,
    id: item.id || item.media_id || item.fid,
    title: item.title || item.name || '未命名合集',
  }
}))
function handleDelPL({ id }) {
  PLStore.removePlaylist(id)
}
function renderSong({ songs }) {
  return songs.filter(song => song)
}
function handleReplacePlaylist(playlist) {
  store.play = playlist.songs[0]
  store.playList = playlist.songs
}
// 增加歌单列表展开和关闭, 手风琴模式
const currentOpen = ref(null)
const isMyOpen = playlist => currentOpen.value === playlist.id
function delSong(playlist, song) {
  PLStore.removeSong(playlist.id, song.id)
}

function switchPlaylist(e) {
  currentOpen.value = currentOpen.value === e.id ? null : e.id
}

const createDialogVis = ref(false)
const playlistName = ref('')
function createPlaylist() {
  const name = playlistName.value.trim()
  if (!name)
    return
  if (list.some(pl => pl.name === name))
    return

  PLStore.createPlaylist(name)
  playlistName.value = ''
  createDialogVis.value = false
}

// 获取收藏夹
watch(userInfo, () => {
  if (!userInfo.value.mid)
    return
  getFavorites({ mid: userInfo.value.mid }).then((res) => {
    favs.value = res.data.list
  })
  getCollectedFavorites({ mid: userInfo.value.mid }).then((res) => {
    collectedFavs.value = res.data.list
  })
})
</script>

<template>
  <div class="library-page">
    <div class="media-top">
      <h2 class="media-title">
        媒体库
      </h2>
      <div class="media-actions">
        <ImpFav compact />
        <button class="media-action-btn" @click="createDialogVis = true">
          <div class="i-tabler:playlist-add w-1em h-1em" />
          新建播放列表
        </button>
      </div>
    </div>
    <h3 class="section-label">
      ENO 收藏夹{{ noPlaylist ? '（暂无歌单）' : '' }}
    </h3>
    <div v-if="!noPlaylist" class="flex flex-col text-left gap-2">
      <section
        v-for="playlist in list" :key="playlist.name"
        class="playlist-card"
      >
        <div class="playlist-head" @click="switchPlaylist(playlist)">
          <div class="playlist-title">
            <div :class="`w-1em h-1em ${isMyOpen(playlist) ? 'i-mingcute:folder-open-2-fill' : 'i-mingcute:folder-fill'}`" />
            <h2 class="max-w-[50vw] truncate" v-html="playlist.name" />
            <span class="count">{{ playlist.songs.length }} 首</span>
          </div>
          <div class="playlist-ops">
            <div
              class="i-tabler:player-play-filled op-icon"
              @click.stop="handleReplacePlaylist(playlist)"
            />
            <div
              class="i-mingcute:delete-2-line op-icon"
              @click.stop="handleDelPL(playlist)"
            />
          </div>
        </div>
        <div
          v-if="isMyOpen(playlist)"
          class="playlist-songs fadeItem"
        >
          <SongItem
            v-for="(song, index) in renderSong(playlist)" :key="song?.id || song?.bvid" :song="song"
            :index="index + 1"
            :del="true"
            @delete-song="delSong(playlist, song)"
          />
          <div v-if="!playlist.songs.length" class="empty-hint">
            暂无歌曲，可以前往搜索页面添加
          </div>
        </div>
      </section>
    </div>
    <h3 class="section-label">
      Bilibili 收藏夹
    </h3>
    <BLFav v-for="fav in normalizedFavs" :key="fav.id" :fav="fav" />
    <h3 class="section-label">
      Bilibili 合集和列表
    </h3>
    <BLFav v-for="fav in normalizedCollectedFavs" :key="fav.id" :fav="fav" tag="collected" />

    <Dialog :open="createDialogVis" title="新建播放列表" @visible-change="createDialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="playlistName"
          type="text"
          class="create-input"
          placeholder="请输入播放列表名称"
          @keyup.enter="createPlaylist"
        >
      </div>
      <template #footer>
        <div class="opt flex flex-row-reverse text-sm gap-3">
          <button class="sp-btn-green" type="button" @click.stop="createPlaylist">
            新建
          </button>
          <button class="sp-btn-ghost" type="button" @click.stop="createDialogVis = false">
            取消
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.library-page {
  height: 100%;
  overflow: auto;
  padding: 24px 32px 40px;
}

.media-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.media-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.media-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.media-action-btn,
:deep(.media-action-btn) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 700;
  color: #000;
  background: #fff;
  cursor: pointer;
}

.media-action-btn:hover,
:deep(.media-action-btn):hover {
  transform: scale(1.04);
}

.section-label {
  margin: 24px 0 12px;
  font-size: 24px;
  font-weight: 700;
}

.playlist-card {
  overflow: hidden;
  border-radius: 8px;
  background: #181818;
}

.playlist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
}

.playlist-head:hover {
  background: #282828;
}

.playlist-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
}

.count {
  color: #b3b3b3;
  font-size: 13px;
  font-weight: 400;
}

.playlist-ops {
  display: flex;
  gap: 12px;
  color: #b3b3b3;
}

.op-icon {
  cursor: pointer;
}

.op-icon:hover {
  color: #fff;
}

.playlist-songs {
  max-height: 320px;
  overflow: auto;
  padding: 0 8px 12px;
}

.empty-hint {
  padding: 16px;
  color: #b3b3b3;
}

.create-input {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 4px;
  padding: 0 12px;
  color: #fff;
  background: #3e3e3e;
}

.sp-btn-green {
  height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  font-weight: 700;
  color: #000;
  background: #1ed760;
  cursor: pointer;
}

.sp-btn-ghost {
  height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  color: #fff;
  background: transparent;
  cursor: pointer;
}
</style>
