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
          title="换用歌曲封面"
          @click="useSongCover(focused)"
        >
        <div
          v-else
          class="detail-cover detail-cover--empty"
          title="换用歌曲封面"
          @click="useSongCover(focused)"
        >
          <div class="i-tabler:folder-filled" />
        </div>
        <div class="detail-head">
          <h1 class="detail-title" v-html="focused.name" />
          <p class="detail-count">
            {{ focused.songs.length }} 首
          </p>
          <div class="detail-actions">
            <button class="play-all" type="button" title="播放全部" @click.stop="handleReplacePlaylist(focused)">
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

      <h2 class="eno-section-title detail-list-title">
        曲目表
      </h2>
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
        <div v-if="!focused.songs.length" class="eno-empty">
          <div class="eno-empty__icon">
            <div class="i-tabler:music" />
          </div>
          <div class="eno-empty__title">
            还没有歌曲
          </div>
          <div class="eno-empty__hint">
            去搜索页找歌，用「添加到」收进来
          </div>
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
          <button class="btn-primary" type="button" @click="createDialogVis = true">
            <div class="i-tabler:playlist-add" />
            新建播放列表
          </button>
        </div>
      </div>

      <h3 class="eno-section-title">
        ENO 收藏夹
        <span class="eno-section-sub">{{ noPlaylist ? '暂无歌单' : `${list.length} 个歌单` }}</span>
      </h3>
      <div v-if="!noPlaylist" class="playlist-list">
        <button
          v-for="(playlist, playlistIndex) in list"
          :key="playlist.id"
          type="button"
          class="playlist-row eno-row"
          @click="ui.openPlaylist(playlist.id)"
          @dragover.prevent
          @drop.prevent="onPlaylistDrop(playlistIndex)"
        >
          <div
            class="drag-grip i-tabler:grip-vertical"
            draggable="true"
            title="拖动排序"
            @click.stop
            @dragstart.stop="onPlaylistDragStart(playlistIndex)"
          />
          <img
            v-if="playlistCover(playlist)"
            class="row-cover"
            :src="playlistCover(playlist)"
            alt=""
          >
          <div v-else class="row-cover row-cover--empty">
            <div class="i-tabler:folder" />
          </div>
          <div class="row-name" v-html="playlist.name" />
          <div class="row-count">
            {{ playlist.songs.length }} 首
          </div>
        </button>
      </div>
      <div v-else class="eno-empty">
        <div class="eno-empty__icon">
          <div class="i-tabler:playlist" />
        </div>
        <div class="eno-empty__title">
          还没有歌单
        </div>
        <div class="eno-empty__hint">
          点右上「新建播放列表」开一本
        </div>
      </div>

      <h3 class="eno-section-title">
        Bilibili 收藏夹
        <span v-if="userInfo?.mid" class="eno-section-sub">{{ normalizedFavs.length }} 个</span>
      </h3>
      <div v-if="!userInfo?.mid" class="lib-hint">
        登录 B 站后可同步收藏夹。
      </div>
      <BLFav v-for="fav in normalizedFavs" :key="fav.id" :fav="fav" />

      <h3 class="eno-section-title">
        Bilibili 合集和列表
        <span v-if="userInfo?.mid" class="eno-section-sub">{{ normalizedCollectedFavs.length }} 个</span>
      </h3>
      <div v-if="!userInfo?.mid && !normalizedCollectedFavs.length" class="lib-hint">
        登录后显示你收藏的合集。
      </div>
      <BLFav v-for="fav in normalizedCollectedFavs" :key="fav.id" :fav="fav" tag="collected" />
    </div>

    <Dialog :open="createDialogVis" title="新建播放列表" @visible-change="createDialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="playlistName"
          type="text"
          class="eno-input create-input"
          placeholder="歌单名称"
          @keyup.enter="createPlaylist"
        >
      </div>
      <template #footer>
        <div class="opt flex flex-row-reverse text-sm gap-3">
          <button class="btn-primary" type="button" @click.stop="createPlaylist">
            新建
          </button>
          <button class="btn" type="button" @click.stop="createDialogVis = false">
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
        class="eno-input create-input"
        placeholder="新名称"
        @keyup.enter="confirmRename"
      >
      <template #footer>
        <div class="opt flex flex-row-reverse text-sm gap-3">
          <button class="btn-primary" type="button" @click.stop="confirmRename">
            保存
          </button>
          <button class="btn" type="button" @click.stop="renameDialogVis = false">
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

/* —— 歌单详情 · 内页曲目表 —— */
.detail-page {
  height: 100%;
  overflow: auto;
  padding: 28px 32px 40px;
}

.detail-hero {
  display: flex;
  align-items: flex-end;
  gap: 28px;
}

.detail-cover {
  width: 176px;
  height: 176px;
  flex-shrink: 0;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-lg);
  object-fit: cover;
  box-shadow: var(--eno-shadow-md);
  cursor: pointer;
  transition: border-color 0.16s var(--eno-ease);
}

.detail-cover:hover {
  border-color: rgb(240 235 221 / 30%);
}

.detail-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--eno-text-3);
  background: var(--eno-cover-dim);
  font-size: 56px;
}

.detail-head {
  min-width: 0;
  padding-bottom: 4px;
}

.detail-title {
  margin: 0 0 10px;
  overflow-wrap: anywhere;
  font-family: var(--app-font-display);
  font-size: clamp(30px, 4.2vw, 52px);
  font-weight: 900;
  letter-spacing: 0.03em;
  line-height: 1.15;
}

.detail-count {
  margin: 0;
  color: var(--eno-text-3);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
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

.ghost--danger:hover {
  color: var(--lp-seal-bright);
  background: var(--eno-primary-light);
}

.detail-list-title {
  margin: 24px 0 6px;
}

.song-row {
  cursor: grab;
}

.song-row:active {
  cursor: grabbing;
}

.song-row :deep(.song-item) {
  border-bottom: 1px solid var(--eno-border);
}

/* —— 媒体库目录 —— */
.library-page {
  height: 100%;
  overflow: auto;
  padding: 24px 32px 40px;
}

.media-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.media-title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.media-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.library-page .eno-section-title {
  margin: 28px 0 12px;
}

.playlist-list {
  display: flex;
  flex-direction: column;
}

.playlist-row {
  display: grid;
  grid-template-columns: 28px 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid var(--eno-border);
  color: var(--eno-text-2);
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.playlist-row:hover {
  background: var(--eno-fill-1);
}

.drag-grip {
  display: inline-flex;
  color: var(--eno-text-4);
  cursor: grab;
  transition: color 0.16s var(--eno-ease);
}

.drag-grip:active {
  cursor: grabbing;
}

.playlist-row:hover .drag-grip {
  color: var(--eno-text-2);
}

.row-cover {
  width: 52px;
  height: 52px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-md);
  object-fit: cover;
}

.row-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--eno-text-3);
  background: var(--eno-cover-dim);
  font-size: 22px;
}

.row-name {
  overflow: hidden;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-count {
  color: var(--eno-text-3);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.lib-hint {
  padding: 14px 12px;
  color: var(--eno-text-3);
  font-size: 13px;
}

.create-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
}

@media (max-width: 860px) {
  .detail-page,
  .library-page {
    padding-right: 16px;
    padding-left: 16px;
  }

  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-cover {
    width: 132px;
    height: 132px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-cover,
  .drag-grip {
    transition: none;
  }
}
</style>
