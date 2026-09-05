<script setup lang="ts">
import { Dialog } from '@cloudfly/eno-ui'
import { useLibraryStore } from '~/stores'

const PLStore = useLibraryStore()
function handleAddSong({ id }: { id: string | number }) {
  PLStore.addSong(id)
  PLStore.addSongDialog = false
}
</script>

<template>
  <Dialog :open="PLStore.addSongDialog" title="添加到" @visible-change="vis => PLStore.addSongDialog = vis">
    <div class="flex flex-col text-left gap-1">
      <section
        class="add-row"
        @click.stop="PLStore.addSongToListenLater"
      >
        <h2 class="w-40 text-lg truncate flex items-center gap-3">
          <div class="i-mingcute:time-fill w-1em h-1em" cursor-pointer />
          稍后播放
        </h2>
      </section>
      <section
        v-for="playlist in PLStore.list" :key="playlist.name"
        class="add-row"
        @click.stop="handleAddSong(playlist)"
      >
        <h2 class="text-lg truncate flex items-center gap-3">
          <div class="i-mingcute:folder-fill w-1em h-1em flex-shrink-0" cursor-pointer />
          <span class="truncate" v-html="playlist.name" />
        </h2>
      </section>
    </div>
  </Dialog>
</template>

<style scoped>
.add-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.add-row:hover {
  background: rgb(255 255 255 / 10%);
}
</style>
