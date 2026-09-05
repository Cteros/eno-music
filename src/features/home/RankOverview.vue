<script setup lang="ts">
import cn from 'classnames'
import { useHomeStore } from '~/stores'

const store = useHomeStore()
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
  <span class="rank-switch">
    <button
      class="rank-nav"
      type="button"
      @click="goDirection(-1)"
    >
      <div class="i-mingcute:align-arrow-left-line" />
    </button>
    <div id="rank-list" class="rank-list">
      <button
        v-for="(rankId, index) in store.ranksId" :id="`rank-${index}`" :key="rankId.ID" :class="cn(
          'rank-chip',
          { 'rank-chip--active': currentIndex === index },
        )" type="button" @click="goTo(rankId.ID, index)"
      >
        第{{ rankId.priod }}期
      </button>
    </div>
    <button
      class="rank-nav"
      type="button"
      @click="goDirection(1)"
    >
      <div class="i-mingcute:align-arrow-right-line" />
    </button>
  </span>
</template>

<style scoped>
.rank-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rank-nav {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(0 0 0 / 40%);
  cursor: pointer;
}

.rank-nav:hover {
  background: rgb(0 0 0 / 60%);
}

.rank-list {
  display: flex;
  width: 220px;
  align-items: center;
  gap: 8px;
  overflow: auto hidden;
  scroll-behavior: smooth;
}

.rank-chip {
  flex-shrink: 0;
  height: 28px;
  border: 0;
  border-radius: 999px;
  padding: 0 12px;
  color: #fff;
  background: rgb(255 255 255 / 10%);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.rank-chip--active {
  color: #000;
  background: #1ed760;
}
</style>
