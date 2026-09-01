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
      <!-- 稍后播放 -->
      <section
        class="w-full cursor-pointer flex justify-between items-center
          opacity-75 hover:opacity-100 px-3 py-1
        " @click.stop="PLStore.addSongToListenLater"
      >
        <h2 class="w-40 text-lg truncate flex items-center gap-3">
          <div class="i-mingcute:time-fill w-1em h-1em" cursor-pointer />
          稍后播放
        </h2>
      </section>
      <!-- 自定义列表 -->
      <section
        v-for="playlist in PLStore.list" :key="playlist.name" class="w-full cursor-pointer flex justify-between items-center
          opacity-75 hover:opacity-100 px-3 py-1
        " @click.stop="handleAddSong(playlist)"
      >
        <h2 class="text-lg truncate flex items-center gap-3">
          <div class="i-mingcute:folder-fill w-1em h-1em flex-shrink-0" cursor-pointer />
          <span class="truncate" v-html="playlist.name" />
        </h2>
      </section>
    </div>
  </Dialog>
</template>
