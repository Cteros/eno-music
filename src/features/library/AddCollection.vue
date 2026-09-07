<script setup lang="ts">
import { Dialog, MessageAPI } from '@cloudfly/eno-ui'
import { cloneDeep } from 'lodash'
import SongItem from '~/shared/components/SongItem.vue'
import { useLibraryStore } from '~/stores'

const PLStore = useLibraryStore()
const targetPlaylistId = ref<string | number>('')

watch(() => PLStore.openCollection, (val) => {
  if (val) {
    targetPlaylistId.value = PLStore.list[0]?.id || ''
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
    targetPlaylistId.value = ''
  }
})

function handleCreateCollection() {
  PLStore.createPlaylist(PLStore.collectionInfo.title, cloneDeep(PLStore.collectionSongs))
  PLStore.openCollection = false
  MessageAPI.show({ type: 'success', message: '已建成新歌单' })
}

function handleAddToExisting() {
  if (!targetPlaylistId.value) {
    MessageAPI.show({ type: 'warning', message: '先选一个歌单' })
    return
  }
  PLStore.addSongs(targetPlaylistId.value, cloneDeep(PLStore.collectionSongs))
  PLStore.openCollection = false
  MessageAPI.show({ type: 'success', message: '已添加到歌单' })
}
</script>

<template>
  <Dialog :open="PLStore.openCollection" title="分P数据" @visible-change="vis => PLStore.openCollection = vis">
    <SongItem v-for="song in PLStore.collectionSongs" :key="song.id" :song="song" size="mini" />
    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
        <select
          v-if="PLStore.list.length"
          v-model="targetPlaylistId"
          class="bg-$eno-fill-4 rounded-2 px-3 py-2 min-w-40"
        >
          <option v-for="playlist in PLStore.list" :key="playlist.id" :value="playlist.id">
            {{ playlist.name }}
          </option>
        </select>
        <button v-if="PLStore.list.length" class="btn" @click="handleAddToExisting">
          添加到歌单
        </button>
        <button class="btn" @click="handleCreateCollection">
          新建成歌单
        </button>
      </div>
    </template>
  </Dialog>
</template>
