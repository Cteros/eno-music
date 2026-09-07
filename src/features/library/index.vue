<script setup lang="ts">
import { Dialog, MessageAPI } from '@cloudfly/eno-ui'
import { computed } from 'vue'

import { getCollectedFavorites, getFavorites } from '~/api'
import SongItem from '~/shared/components/SongItem.vue'
import { useLibraryStore, usePlayerStore, useUiStore } from '~/stores'
import BLFav from './BiliFav.vue'
import ImpFav from './ImportFav.vue'

const userInfo = inject('userInfo')
const store = usePlayerStore()
const PLStore = useLibraryStore()
const ui = useUiStore()
const list = PLStore.list
const noPlaylist = computed(() => list?.length === 0)
const focused = computed(() => {
  if (ui.playlistId == null)
    return null
  return list.find(item => String(item.id) === String(ui.playlistId)) || null
})
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
  const opening = String(ui.playlistId) === String(id)
  PLStore.removePlaylist(id)
  if (opening)
    ui.go('playlist', { replace: true })
}
function renderSong({ songs }) {
  return songs.filter(song => song)
}
function playlistCover(playlist: { cover?: string, songs?: { cover?: string }[] }) {
  return playlist.cover || playlist.songs?.find(song => song?.cover)?.cover || ''
}

let draggingPlaylist = -1
let draggingSong = { playlistId: '' as string | number, index: -1 }

function onPlaylistDragStart(index: number) {
  draggingPlaylist = index
}

function onPlaylistDrop(index: number) {
  if (draggingPlaylist < 0)
    return
  PLStore.reorderPlaylists(draggingPlaylist, index)
  draggingPlaylist = -1
}

function onSongDragStart(playlistId: string | number, index: number) {
  draggingSong = { playlistId, index }
}

function onSongDrop(playlistId: string | number, index: number) {
  if (draggingSong.playlistId !== playlistId || draggingSong.index < 0)
    return
  PLStore.reorderSongs(playlistId, draggingSong.index, index)
  draggingSong = { playlistId: '', index: -1 }
}

function useSongCover(playlist: { id: string | number, songs: { cover?: string }[] }) {
  const cover = playlist.songs.find(song => song?.cover)?.cover
  if (cover)
    PLStore.setPlaylistCover(playlist.id, cover)
}

function handleReplacePlaylist(playlist) {
  if (!playlist?.songs?.length)
    return
  store.play = playlist.songs[0]
  store.playList = playlist.songs
}

function handleDedupe(playlist: { id: string | number }) {
  const removed = PLStore.dedupePlaylist(playlist.id)
  MessageAPI.show({
    type: removed ? 'success' : 'info',
    message: removed ? `已去掉 ${removed} 首重复` : '没有重复歌曲',
  })
}

function handleShuffle(playlist: { id: string | number }) {
  PLStore.shufflePlaylist(playlist.id)
  MessageAPI.show({ type: 'success', message: '已打乱歌单顺序' })
}

function delSong(playlist, song) {
  PLStore.removeSong(playlist.id, song.id)
}

const createDialogVis = ref(false)
const playlistName = ref('')
const renameDialogVis = ref(false)
const renameTarget = ref<{ id: string | number, name: string } | null>(null)
function createPlaylist() {
  const name = playlistName.value.trim()
  if (!name)
    return
  if (list.some(pl => pl.name === name))
    return

  const id = PLStore.createPlaylist(name)
  playlistName.value = ''
  createDialogVis.value = false
  ui.openPlaylist(id)
}

function startRename(playlist: { id: string | number, name: string }) {
  renameTarget.value = { id: playlist.id, name: playlist.name }
  renameDialogVis.value = true
}

function confirmRename() {
  const name = renameTarget.value?.name?.trim()
  if (!renameTarget.value || !name)
    return
  PLStore.renamePlaylist(renameTarget.value.id, name)
  renameDialogVis.value = false
  renameTarget.value = null
}

watch(() => PLStore.promptCreate, (open) => {
  if (!open)
    return
  createDialogVis.value = true
  PLStore.promptCreate = false
})

watch([() => ui.playlistId, () => PLStore.list.length], () => {
  if (ui.mode !== 'playlist' || ui.playlistId == null)
    return
  if (!focused.value)
    ui.go('playlist', { replace: true })
})

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
  <div class="library-root">
    <div v-if="focused" class="detail-page">
      <header class="detail-hero">
        <img
          v-if="playlistCover(focused)"
          class="detail-cover"
          :src="playlistCover(focused)"
          alt=""
          @click="useSongCover(focused)"
        >
        <div
          v-else
          class="detail-cover detail-cover--empty"
          @click="useSongCover(focused)"
        >
          <div class="i-mingcute:folder-fill" />
        </div>
        <div>
          <div class="kicker">
            播放列表
          </div>
          <h1 v-html="focused.name" />
          <p>{{ focused.songs.length }} 首</p>
          <div class="detail-actions">
            <button class="play-all" type="button" title="播放" @click.stop="handleReplacePlaylist(focused)">
              <div class="i-tabler:player-play-filled" />
            </button>
            <button class="ghost" type="button" title="打乱顺序" @click.stop="handleShuffle(focused)">
              打乱
            </button>
            <button class="ghost" type="button" title="去掉重复" @click.stop="handleDedupe(focused)">
              去重
            </button>
            <button class="ghost" type="button" title="重命名" @click.stop="startRename(focused)">
              重命名
            </button>
            <button class="ghost ghost--danger" type="button" title="删除歌单" @click.stop="handleDelPL(focused)">
              删除
            </button>
          </div>
        </div>
      </header>
      <div class="detail-list">
        <div
          v-for="(song, index) in renderSong(focused)"
          :key="song?.id || song?.bvid"
          class="song-row"
          draggable="true"
          @dragstart.stop="onSongDragStart(focused.id, index)"
          @dragover.prevent
          @drop.stop.prevent="onSongDrop(focused.id, index)"
        >
          <SongItem
            :song="song"
            :index="index + 1"
            :del="true"
            @delete-song="delSong(focused, song)"
          />
        </div>
        <div v-if="!focused.songs.length" class="empty-hint">
          暂无歌曲，可以前往搜索页面添加
        </div>
      </div>
    </div>

    <div v-else class="library-page">
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
      <div v-if="!noPlaylist" class="playlist-grid">
        <button
          v-for="(playlist, playlistIndex) in list"
          :key="playlist.id"
          type="button"
          class="playlist-tile"
          @click="ui.openPlaylist(playlist.id)"
          @dragover.prevent
          @drop.prevent="onPlaylistDrop(playlistIndex)"
        >
          <div
            class="drag-grip i-mingcute:dots-2-line"
            draggable="true"
            title="拖动排序"
            @click.stop
            @dragstart.stop="onPlaylistDragStart(playlistIndex)"
          />
          <img
            v-if="playlistCover(playlist)"
            class="tile-cover"
            :src="playlistCover(playlist)"
            alt=""
          >
          <div v-else class="tile-cover tile-cover--empty">
            <div class="i-mingcute:folder-fill" />
          </div>
          <div class="tile-meta">
            <div class="tile-name" v-html="playlist.name" />
            <div class="tile-count">
              {{ playlist.songs.length }} 首
            </div>
          </div>
        </button>
      </div>
      <h3 class="section-label">
        Bilibili 收藏夹
      </h3>
      <div v-if="!userInfo?.mid" class="empty-hint">
        登录 B 站后可同步收藏夹。
      </div>
      <BLFav v-for="fav in normalizedFavs" :key="fav.id" :fav="fav" />
      <h3 class="section-label">
        Bilibili 合集和列表
      </h3>
      <div v-if="!userInfo?.mid && !normalizedCollectedFavs.length" class="empty-hint">
        登录后显示你收藏的合集。
      </div>
      <BLFav v-for="fav in normalizedCollectedFavs" :key="fav.id" :fav="fav" tag="collected" />
    </div>

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

    <Dialog :open="renameDialogVis" title="重命名播放列表" @visible-change="renameDialogVis = $event">
      <input
        v-if="renameTarget"
        v-model="renameTarget.name"
        type="text"
        class="create-input"
        placeholder="新的名称"
        @keyup.enter="confirmRename"
      >
      <template #footer>
        <div class="opt flex flex-row-reverse text-sm gap-3">
          <button class="sp-btn-green" type="button" @click.stop="confirmRename">
            保存
          </button>
          <button class="sp-btn-ghost" type="button" @click.stop="renameDialogVis = false">
            取消
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.library-root {
  height: 100%;
}

.library-page {
  height: 100%;
  overflow: auto;
  padding: 8px 32px 40px;
}

.detail-page {
  height: 100%;
  overflow: auto;
  background: linear-gradient(180deg, #2a5a45 0%, #121212 42%);
}

.detail-hero {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  padding: 16px 32px 32px;
}

.detail-cover {
  width: 192px;
  height: 192px;
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 8px 24px rgb(0 0 0 / 50%);
  cursor: pointer;
}

.detail-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  color: #b3b3b3;
  background: #2a2a2a;
}

.kicker {
  font-size: 13px;
  font-weight: 700;
}

.detail-hero h1 {
  margin: 8px 0 12px;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
}

.detail-hero p {
  margin: 0;
  color: #b3b3b3;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.ghost--danger:hover {
  color: #f87171;
}

.detail-list {
  padding: 8px 16px 40px;
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

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 16px;
}

.playlist-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 0;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  color: #fff;
  background: #181818;
  cursor: pointer;
}

.playlist-tile:hover {
  background: #282828;
}

.drag-grip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  color: #7a7a7a;
  cursor: grab;
}

.drag-grip:active {
  cursor: grabbing;
}

.tile-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  object-fit: cover;
}

.tile-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #b3b3b3;
  background: #2a2a2a;
}

.tile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
}

.tile-count {
  margin-top: 4px;
  color: #b3b3b3;
  font-size: 13px;
}

.song-row {
  cursor: grab;
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

@media (max-width: 860px) {
  .library-page,
  .detail-hero {
    padding-left: 16px;
    padding-right: 16px;
  }

  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-cover {
    width: 148px;
    height: 148px;
  }
}
</style>
