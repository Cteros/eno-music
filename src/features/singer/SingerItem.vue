<script setup lang="ts">
import { useSingerStore, useUiStore } from '~/stores'

const props = defineProps({
  singerMid: String,
  canDel: {
    type: Boolean,
    default: false,
  },
  shape: {
    type: String,
    default: 'circle',
  },
})
const store = useUiStore()
const PLstore = useSingerStore()
const info = computed(() => PLstore.singerCardCache[props.singerMid])
const avatar = computed(() => info.value?.face || '')
const name = computed(() => info.value?.name || '')
const desc = computed(() => {
  const { name } = info.value?.nameplate || {}
  return `${name || '暂无'}`
})

function handleSingerDetail(singerMid) {
  store.mode = 'singerDetail'
  PLstore.currentSinger = singerMid
}
</script>

<template>
  <div
    class="singer-item group"
    @click.stop="handleSingerDetail(singerMid)"
  >
    <div class="singer-main">
      <img
        :src="avatar"
        alt="singerAvatar"
        class="singer-avatar"
      >
      <div class="min-w-0">
        <div class="singer-name">
          {{ name }}
        </div>
        <div class="singer-desc">
          {{ desc }}
        </div>
      </div>
    </div>

    <div class="singer-actions">
      <div class="i-mingcute:right-line h-[16px] w-[16px] opacity-55 transition-all duration-200 group-hover:translate-x-[1px] group-hover:opacity-90" />
      <div
        v-if="canDel"
        class="i-mingcute:delete-3-line h-[16px] w-[16px] cursor-pointer text-$eno-text-3 transition-colors duration-200 hover:text-red-400"
        @click.stop="PLstore.removeSinger(singerMid)"
      />
    </div>
  </div>
</template>

<style scoped>
.singer-item {
  display: flex;
  width: 18.75rem;
  max-width: 100%;
  height: 4.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  border: 1px solid var(--eno-border);
  border-radius: 12px;
  background: color-mix(in oklab, var(--eno-content), transparent 6%);
  box-shadow: 0 1px 1px rgb(0 0 0 / 12%);
  cursor: pointer;
  transition: transform 0.18s var(--eno-ease), border-color 0.18s var(--eno-ease), background-color 0.18s var(--eno-ease);
}

.singer-item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--eno-border), var(--eno-text-2) 28%);
  background: color-mix(in oklab, var(--eno-content-hover), transparent 8%);
}

.singer-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.singer-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 8%);
  border-radius: 999px;
  object-fit: cover;
}

.singer-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
  font-weight: 620;
  line-height: 1.2rem;
  letter-spacing: -0.01em;
  color: var(--eno-text-1);
}

.singer-desc {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  line-height: 1rem;
  color: var(--eno-text-3);
}

.singer-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--eno-text-3);
}
</style>
