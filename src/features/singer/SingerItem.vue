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
  PLstore.currentSinger = singerMid
  store.go('singerDetail')
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
  border: 1px solid var(--eno-border, rgb(255 255 255 / 7%));
  border-radius: var(--eno-radius-xl, 16px);
  background: var(--eno-content, #16161c);
  cursor: pointer;
  transition:
    background-color 0.2s var(--eno-ease),
    transform 0.2s var(--eno-ease-pop, cubic-bezier(0.34, 1.4, 0.64, 1)),
    border-color 0.2s var(--eno-ease),
    box-shadow 0.2s var(--eno-ease);
}

.singer-card:hover {
  transform: translateY(-4px);
  border-color: rgb(255 255 255 / 14%);
  background: var(--eno-content-hover, #26262f);
  box-shadow: 0 10px 28px rgb(0 0 0 / 45%), 0 0 24px rgb(30 215 96 / 10%);
}

.singer-card:hover .singer-avatar {
  box-shadow: 0 8px 24px rgb(0 0 0 / 50%), 0 0 0 2px rgb(30 215 96 / 40%), 0 0 22px rgb(30 215 96 / 22%);
  transform: scale(1.03);
}

.singer-card:active {
  transform: translateY(0) scale(0.98);
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
  transition: transform 0.22s var(--eno-ease-pop, cubic-bezier(0.34, 1.4, 0.64, 1)), box-shadow 0.22s var(--eno-ease);
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

.del-btn:hover {
  transform: scale(1.08);
}

.del-btn:active {
  transform: scale(0.9);
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
