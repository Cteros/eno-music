<script setup>
import { cloneDeep } from 'lodash'
import { Dialog } from '@cloudfly/eno-ui'
import SongItem from '../components/SongItem.vue'
import { usePlaylistStore } from './store'

const PLStore = usePlaylistStore()
watch(() => PLStore.openCollection, (val) => {
  if (val) {
    // 分P数据, 打开时生成
    PLStore.collectionSongs = PLStore.collectionInfo.pages.map(item => ({
      id: item.cid,
      eno_song_type: 'cid',
      cid: item.cid,
      bvid: PLStore.collectionInfo.bvid,
      cover: item.first_frame,
      title: item.part,
      description: `${item.part}-${PLStore.collectionInfo.description}`,
      author: PLStore.collectionInfo.owner?.name || '未知',
      duration: item.duration,
    }))
  }
  else {
    PLStore.collectionInfo = {}
    PLStore.collectionSongs = []
  }
})

function handleCreateCollection() {
  PLStore.createPlaylist(PLStore.collectionInfo.title, cloneDeep(PLStore.collectionSongs))
  PLStore.openCollection = false
}
</script>

<template>
  <Dialog :open="PLStore.openCollection" title="分P数据" @visible-change="vis => PLStore.openCollection = vis">
    <SongItem v-for="song in PLStore.collectionSongs" :key="song.id" :song="song" size="mini" />
    <template #footer>
      <div class="flex gap-3 justify-end pt-2">
        <button class="btn" @click="handleCreateCollection">
          新建成歌单
        </button>
        <!-- <button class="btn">
          添加到歌单
        </button> -->
      </div>
    </template>
  </Dialog>
</template>
