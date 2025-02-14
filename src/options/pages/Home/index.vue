<script setup>
import { computed, onMounted } from 'vue'
import { cloneDeep } from 'lodash'
import { usePlaylistStore } from '../../playlist/store'
import { useBlblStore } from '../../blbl/store'
import RankOverview from './rankOverview.vue'
import HomeSinger from './home-singer.vue'
import SingerPreview from './singer-preview.vue'
import ScrollButton from './scroll-button.vue'
import SingerItem from '~/options/components/SingerItem.vue'

const store = useBlblStore()
const PLstore = usePlaylistStore()
const rankScroll = ref(null)

onMounted(() => {
  store.initHomePage()
})
function handlePlayRank() {
  store.playList = cloneDeep(store.musicRankList)
  store.play = store.musicRankList[0] || {}
}
function handleScroll(offset) {
  rankScroll.value.scrollTo({
    left: rankScroll.value.scrollLeft + offset,
    behavior: 'smooth',
  })
}
const mainSong = computed(() => {
  return store.musicRankList[0]
})
</script>

<template>
  <section w-full h-screen overflow-auto pb-30>
    <!-- bilibili音乐榜 -->
    <h5 text="3xl $eno-text-1 fw-600" class="py-5 text-left px-10 flex items-end gap-3 inline-flex relative w-full">
      <div class="i-mingcute:play-circle-line w-1em h-1em cursor-pointer" @click="handlePlayRank" />
      bilibili音乐榜
      <span text="sm $eno-text-2" class="ml-2">
        (每周五18:00更新)
      </span>
      <RankOverview />
      <ScrollButton :step="600" :handle-scroll="handleScroll" />
    </h5>
    <div class="w-full grid grid-cols-2 gap-5 px-10">
      <div class="w-full">
        <div class="w-full aspect-video rounded-md overflow-hidden">
          <img class="w-full h-full object-cover rounded-md" :src="mainSong.cover">
        </div>
      </div>
      <div class="w-full h-full overflow-auto relative">
        <div class="flex gap-5 flex-col absolute top-0 left-0">
          <div v-for="song in store.musicRankList" :key="song.id" class="flex group transition-all duration-50 cursor-pointer" @click="store.startPlay(song)">
            <img class="w-20 aspect-video object-cover rounded-md" :src="song.cover">
            <div class="flex flex-col ml-4">
              <div class="$eno-text-2 text-lg truncate group-hover:underline">
                {{ song.title }}
              </div>
              <div class="$eno-text-2 text-xs opacity-70 truncate w-40 group-hover:opacity-100 transition-all duration-50">
                {{ song.author }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <h3 class="text-3xl mt-10 mb-5 px-10">
      关注歌手
    </h3>
    <div class="flex gap-5 flex-wrap w-full px-10">
      <SingerItem v-for="serid in PLstore.singers" :key="serid" :singer-mid="serid" can-del />
    </div>
  </section>
</template>

<style>
.wrapper-scroll {
  mask-image: linear-gradient(to bottom,
      transparent,
      #000 0% 80%,
      transparent);
}
</style>
