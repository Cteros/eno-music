<script setup>
import { onMounted } from 'vue'
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

    <div ref="rankScroll" overflow-auto class="w-full h-55 pb-20 relative">
      <div class="absolute w-full h-full flex gap-5 px-10">
        <div
          v-for="(bannerSong) in store.musicRankList" :key="bannerSong.id" class="cursor-pointer"
          @click.stop="store.startPlay(bannerSong)"
        >
          <img class="h-40 rounded-md" :src="bannerSong.cover">
          <div class="$eno-text-2 text-lg truncate w-40 mt-2">
            {{ bannerSong.title }}
          </div>
          <div class="$eno-text-2 text-xs opacity-70 truncate w-40">
            {{ bannerSong.author }}
          </div>
        </div>
      </div>
    </div>
    <h3 class="text-3xl mt-10 mb-5 px-10">
      关注歌手
    </h3>
    <div class="flex gap-5 flex-wrap mb-30 w-full px-10">
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
