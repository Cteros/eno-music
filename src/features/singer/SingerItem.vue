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
  return `${name || '艺人'}`
})

function handleSingerDetail(singerMid) {
  store.mode = 'singerDetail'
  PLstore.currentSinger = singerMid
}
</script>

<template>
  <div
    class="singer-card group"
    @click.stop="handleSingerDetail(singerMid)"
  >
    <div class="avatar-wrap">
      <img
        :src="avatar"
        alt="singerAvatar"
        class="singer-avatar"
      >
      <button
        v-if="canDel"
        type="button"
        class="del-btn"
        @click.stop="PLstore.removeSinger(singerMid)"
      >
        <div class="i-mingcute:delete-3-line" />
      </button>
    </div>
    <div class="singer-name">
      {{ name }}
    </div>
    <div class="singer-desc">
      {{ desc }}
    </div>
  </div>
</template>

<style scoped>
.singer-card {
  width: 180px;
  padding: 16px;
  border-radius: 8px;
  background: #181818;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease);
}

.singer-card:hover {
  background: #282828;
}

.avatar-wrap {
  position: relative;
  margin-bottom: 16px;
}

.singer-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 24px rgb(0 0 0 / 50%);
}

.del-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  display: none;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(0 0 0 / 70%);
  cursor: pointer;
}

.group:hover .del-btn {
  display: inline-flex;
}

.singer-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.singer-desc {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #b3b3b3;
}
</style>
