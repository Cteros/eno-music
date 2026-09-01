<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cloneDeep } from 'lodash'
import RankOverview from './RankOverview.vue'
import SingerItem from '~/features/singer/SingerItem.vue'
import { useHomeStore, usePlayerStore, useSingerStore } from '~/stores'

const home = useHomeStore()
const player = usePlayerStore()
const singerStore = useSingerStore()

onMounted(() => {
  home.initHomePage()
})
function handlePlayRank() {
  player.playList = cloneDeep(home.musicRankList)
  player.play = home.musicRankList[0] || {}
}
const mainSong = computed(() => {
  return home.musicRankList[0]
})
</script>

<template>
  <section w-full h-screen overflow-auto pb-30>
    <!-- bilibili音乐榜 -->
    <h5 text="2xl $eno-text-1 fw-600" class="py-5 text-left px-8 flex items-end gap-3 inline-flex relative w-full tracking-tight">
      <div class="i-mingcute:play-circle-line w-1em h-1em cursor-pointer" @click="handlePlayRank" />
      bilibili音乐榜
      <span text="sm $eno-text-2" class="ml-2">
        (每周五18:00更新)
      </span>
      <RankOverview />
    </h5>
    <div v-if="mainSong" class="w-full grid grid-cols-2 gap-4 px-8">
      <div class="w-full">
        <div class="w-full aspect-video rounded-lg overflow-hidden border border-$eno-border">
          <img class="w-full h-full object-cover rounded-lg" :src="mainSong.cover">
        </div>
      </div>
      <div class="w-full h-full overflow-auto relative">
        <div class="flex gap-3 flex-col absolute top-0 left-0">
          <div v-for="song in home.musicRankList" :key="song.id" class="flex group transition-all duration-120 cursor-pointer rounded-3 p-2 hover:bg-$eno-fill-1" @click="player.startPlay(song)">
            <img class="w-18 aspect-video object-cover rounded-md border border-$eno-border" :src="song.cover">
            <div class="flex flex-col ml-3">
              <div class="$eno-text-2 text-[14px] font-600 truncate group-hover:text-$eno-text-1 transition-colors">
                {{ song.title }}
              </div>
              <div class="$eno-text-3 text-xs opacity-85 truncate w-40 group-hover:opacity-100 transition-all duration-120">
                {{ song.author }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="w-full px-10 py-20 text-center text-$eno-text-2">
      <div class="i-mingcute:loading-line animate-spin text-4xl mx-auto mb-4" />
      <div>加载中...</div>
    </div>
    <h3 class="text-2xl mt-10 mb-4 px-8 tracking-tight">
      关注歌手
    </h3>
    <div class="flex gap-4 flex-wrap w-full px-8">
      <SingerItem v-for="serid in singerStore.singers" :key="serid" :singer-mid="serid" can-del />
    </div>
  </section>
</template>
