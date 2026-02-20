<script setup>
import { cloneDeep } from 'lodash'
import SongItem from '~/options/components/SongItem.vue'
import { usePlaylistStore } from '~/options/playlist/store'
import { getSeasonInfo } from '~/options/api/index'
import Dialog from '~/components/dialog/index.vue'

const PLStore = usePlaylistStore()

function getSid(url) {
// https://space.bilibili.com/3493093607213343/channel/collectiondetail?sid=1657149
  return url.match(/sid=(\d+)/)[1]
}

const season = reactive({
  open: false,
  url: '',
  mediaInfo: {},
  mediaSong: [],
})

async function handleSearchSeason() {
  if (!season.url)
    return
  const season_id = getSid(season.url)
  const res = await getSeasonInfo({ season_id, page_size: 100 })
  const { meta, archives } = res.data

  season.mediaInfo = {
    title: meta.name,
  }
  season.mediaSong = archives.map((element) => {
    return {
      title: element.title,
      description: element.desc,
      eno_song_type: 'bvid',
      cover: element.pic,
      duration: element.duration,
      id: element.bvid || element.bv_id,
      bvid: element.bvid || element.bv_id,
    }
  })
}

watch(() => season.open, () => {
  if (!season.open) {
    season.url = ''
    // reset
    season.mediaSong = []
    season.mediaInfo = {}
  }
})

function addNewSeasonPlayList() {
  if (!season.mediaSong.length)
    return
  PLStore.createPlaylist(season.mediaInfo.title, cloneDeep(season.mediaSong))
  season.open = false
}
</script>

<template>
  <div class="flex gap-3">
    <button class="bg-$eno-primary hover:bg-$eno-primary-hover px-3 py-1 mb-5 text-xl text-black font-bold rounded-2 transition-colors" @click.stop="season.open = true">
      导入合集
    </button>
    <Dialog :open="season.open" title="解析合集列表" @visible-change="v => season.open = v">
      <div class="flex flex-col gap-3">
        <div class="flex gap-3">
          <input
            v-model="season.url" type="text" bg="$eno-fill-dark-1 focus:$eno-content-hover"
            class="w-full px-4 py-2 rounded-4" focus:outline-none focus:shadow-outline placeholder="合集链接"
            @keyup.enter="handleSearchSeason"
          >
          <button class="btn-primary w-20" @click="handleSearchSeason">
            解析
          </button>
        </div>
        <!-- 歌曲列表 -->
        <div class="flex-1 overflow-auto">
          <SongItem
            v-for="song in season.mediaSong" :key="song.id" :song="song" del size="mini" :later="false" :star="false"
            @deleteSong="season.mediaSong = season.mediaSong.filter(s => s.id !== song.id)"
          />
        </div>
      </div>
      <template #footer>
        <button class="w-full btn-primary" @click="addNewSeasonPlayList">
          添加为歌单
        </button>
      </template>
    </Dialog>
  </div>
</template>
