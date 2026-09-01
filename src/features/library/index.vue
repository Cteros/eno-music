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
  <div class="p-10 h-screen overflow-auto pb-25">
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
    <!-- 创建歌单部分 -->
    <h3 class="text-xl my-3">
      ENO 收藏夹{{ noPlaylist ? '（暂无ENO 歌单）' : '' }}
    </h3>
    <div v-if="!noPlaylist" class="flex flex-col text-left gap-5">
      <!-- 循环歌单列表 -->
      <section
        v-for="playlist in list" :key="playlist.name"
        class="w-full has-border"
        p="x-4 y-3"
        rounded-lg
        transition-200
        bg="$eno-content hover:$eno-content-hover"
      >
        <div class="flex justify-between items-center w-full" cursor-pointer @click="switchPlaylist(playlist)">
          <div class="flex items-center gap-3 text-[22px]">
            <div :class="`w-1em h-1em ${isMyOpen(playlist) ? 'i-mingcute:folder-open-2-fill' : 'i-mingcute:folder-fill'}`" />
            <h2 class="max-w-[50vw] truncate" text-lg v-html="playlist.name" />
            <span class="mx-2 text-lg">({{ playlist.songs.length }})</span>
          </div>
          <div class="flex gap-3" all:transition-200>
            <div
              class="i-mingcute:play-circle-line" text-xl cursor-pointer
              color="gray hover:gray-50"
              @click.stop="handleReplacePlaylist(playlist)"
            />
            <div
              class="i-mingcute:delete-2-line"
              color="gray hover:gray-50"
              text-xl cursor-pointer
              @click.stop="handleDelPL(playlist)"
            />
          </div>
        </div>
        <!-- 歌曲列表 -->
        <div
          v-if="isMyOpen(playlist)"
          class="flex gap-3 flex-col w-full py-3 wrapper-transition fadeItem text-[16px] max-h-80 overflow-auto"
        >
          <SongItem
            v-for="song in renderSong(playlist)" :key="song?.id || song?.bvid" :song="song"
            :del="true"
            @delete-song="delSong(playlist, song)"
          />
          <!-- 没有歌曲时 -->
          <div v-if="!playlist.songs.length" class="px-10 py-3 text-3xl">
            暂无歌单, 可以前往搜索页面添加
          </div>
        </div>
      </section>
    </div>
    <h3 class="text-xl my-3">
      BLBL 收藏夹
    </h3>
    <BLFav v-for="fav in normalizedFavs" :key="fav.id" :fav="fav" />
    <h3 class="text-xl my-3">
      BLBL 合集和列表
    </h3>
    <BLFav v-for="fav in normalizedCollectedFavs" :key="fav.id" :fav="fav" tag="collected" />

    <Dialog :open="createDialogVis" title="新建播放列表" @visible-change="createDialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="playlistName"
          type="text"
          class="border-none outline-none bg-$eno-content-hover h-10 px-3 autofocus rounded-3 text-$eno-text-1"
          placeholder="请输入播放列表名称"
          @keyup.enter="createPlaylist"
        >
      </div>
      <template #footer>
        <div class="opt flex flex-row-reverse text-sm gap-3">
          <div class="bg-$eno-primary text-black px-4 py-1 rounded-3 cursor-pointer hover:bg-$eno-primary-hover" @click.stop="createPlaylist">
            新建
          </div>
          <div class="hover:bg-$eno-fill-2 px-4 py-1 rounded-3 cursor-pointer" @click.stop="createDialogVis = false">
            取消
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.media-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.media-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--eno-text-1);
}

.media-actions {
  display: flex;
  align-items: center;
  gap: 0.58rem;
}

.media-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 2.35rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 12%);
  border-radius: 11px;
  padding: 0 0.86rem;
  font-size: 0.88rem;
  font-weight: 620;
  color: var(--eno-text-1);
  background: linear-gradient(180deg, rgb(255 255 255 / 8%), rgb(255 255 255 / 2%));
  cursor: pointer;
  transition: border-color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.media-action-btn:hover {
  border-color: color-mix(in oklab, var(--eno-border), white 24%);
  background: linear-gradient(180deg, rgb(255 255 255 / 11%), rgb(255 255 255 / 3%));
}

.media-action-btn:active {
  transform: translateY(1px);
}

.wrapper-transition {
  transform: all 0.5s;
}

.song-item:hover>div {
  opacity: 1;
}
</style>
