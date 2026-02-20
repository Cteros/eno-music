<script setup>
import cn from 'classnames'
import { useBlblStore } from '../../blbl/store'

const store = useBlblStore()
const currentIndex = ref(0)

function goDirection(direction) {
  const el = document.getElementById('rank-list')
  el.scrollLeft += direction * el.clientWidth
}

function goTo(id, index) {
  store.getRankById(id)
  currentIndex.value = index
}
</script>

<template>
  <span class="flex flex-1 gap-1 h-5">
    <div
      class="cursor-pointer hov-item p-0 w-10 h-full flex text-lg items-center justify-center rounded-full"
      @click="goDirection(-1)"
    >
      <div class="i-mingcute:align-arrow-left-line cursor-pointer" />
    </div>
    <div id="rank-list" class="w-40 flex items-center overflow-auto overflow-y-hidden gap-3">
      <div
        v-for="(rankId, index) in store.ranksId" :id="`rank-${index}`" :key="rankId.ID" :class="cn(
          'text-center text-sm flex-shrink-0 cursor-pointer hover:opacity-70',
          { 'text-$eno-primary': currentIndex === index },
        )" @click="goTo(rankId.ID, index)"
      >
        第{{ rankId.priod }}期
      </div>
    </div>
    <div
      class="cursor-pointer hov-item p-0 w-10 h-full flex text-lg items-center justify-center rounded-full"
      @click="goDirection(1)"
    >
      <div class="i-mingcute:align-arrow-right-line" />
    </div>
  </span>
</template>

<style scoped>
#rank-list {
  scroll-behavior: smooth;
}
</style>
