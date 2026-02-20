<script setup>
import { computed, onMounted } from 'vue'
import SongItem from '../components/SongItem.vue'

import { useBlblStore } from '../blbl/store'
import ImpFav from './Imp-Fav.vue'
import BLFav from './BL-Fav.vue'
import { usePlaylistStore } from './store'
import { getCollectedFavorites, getFavorites, getUserInfo } from '~/options/api'

const userInfo = inject('userInfo')
const store = useBlblStore()
const PLStore = usePlaylistStore()
const list = PLStore.list
const noPlaylist = computed(() => list?.length === 0)
// bilibili 里面的 收藏夹
const favs = ref([])
const collectedFavs = ref([])
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
    <ImpFav />
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
            @deleteSong="delSong(playlist, song)"
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
    <BLFav v-for="fav in favs" :key="fav.id" :fav="fav" />
    <h3 class="text-xl my-3">
      BLBL 合集和列表(waiting)
    </h3>
    <BLFav v-for="fav in collectedFavs" :key="fav.id" :fav="fav" />
  </div>
</template>

<style scoped>
.wrapper-transition {
  transform: all 0.5s;
}

.song-item:hover>div {
  opacity: 1;
}
</style>
