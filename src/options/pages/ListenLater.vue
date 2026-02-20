<script setup>
import { cloneDeep } from 'lodash'
import SongItem from '~/options/components/SongItem.vue'
import { usePlaylistStore } from '~/options/playlist/store'
import { useBlblStore } from '~/options/blbl/store'

const PLStore = usePlaylistStore()
const store = useBlblStore()

onMounted(() => {
  if (!PLStore.listenLater.length)
    PLStore.listenLater = []
})
function handlePlayLater() {
  if (!PLStore.listenLater.length)
    return
  const playlist = cloneDeep(PLStore.listenLater)
  store.play = playlist[0]
  store.playList = playlist
}
function handleRemoveListenLater(song) {
  PLStore.listenLater = PLStore.listenLater.filter(item => item.id !== song.id)
}
</script>

<template>
  <div class="flex flex-row w-full h-screen overflow-auto">
    <div class="px-10 pl-30 pt-20 h-full text-center flex flex-col">
      <div class="content flex flex-col gap-2">
        <div id="later-bg" class="w-[300px] h-[300px] mb-4">
          <div
            class="i-mingcute:bookmark-fill
            w-1em h-1em text-[200px] mt-[50px] ml-[50px]" absolute
          />
        </div>
        <div class="text-3xl flex justify-center items-center gap-3">
          稍后播放
          <div class="i-mingcute:play-circle-line w-1em h-1em" cursor-pointer @click.stop="handlePlayLater" />
        </div>
        <div opacity-75>
          总共{{ PLStore.listenLater?.length || 0 }}集
        </div>
        <div opacity-75>
          你已保存供日后观看的播客分集
        </div>
        <div @click="PLStore.listenLater = []">
          清空全部
        </div>
      </div>
    </div>
    <!-- 滚动区域 -->
    <div class="flex-1 h-full overflow-auto pt-10 pb-30 pr-30">
      <div v-if="!PLStore.listenLater.length">
        暂无数据
      </div>
      <div class="content flex flex-col gap-3">
        <SongItem
          v-for="item in PLStore.listenLater" :key="item.id" :song="item" :del="true" :later="false"
          @deleteSong="handleRemoveListenLater(item)"
        />
      </div>
    </div>
  </div>
</template>

<style>
/* 生成一个多点的淡紫色黄色的渐变 */
#later-bg {
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
}

.song-later-item:hover .delicon {
  display: block;
}
</style>
