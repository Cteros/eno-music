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
      title="上一组"
      @click="goDirection(-1)"
    >
      <div class="i-tabler:arrow-left" />
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
      title="下一组"
      @click="goDirection(1)"
    >
      <div class="i-tabler:arrow-right" />
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
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-3);
  background: transparent;
  cursor: pointer;
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
  padding: 0 12px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: var(--eno-fill-1);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease), border-color 0.16s var(--eno-ease);
}

.rank-chip:hover:not(.rank-chip--active) {
  border-color: rgb(240 235 221 / 26%);
  color: var(--eno-text-1);
  background: var(--eno-fill-2);
}

.rank-chip--active {
  border-color: var(--lp-seal-bright);
  color: var(--lp-seal-bright);
  background: var(--eno-primary-light);
}
</style>
