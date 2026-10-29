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
    class="singer-row eno-row group"
    @click.stop="handleSingerDetail(singerMid)"
  >
    <div class="avatar-wrap">
      <img
        :src="avatar"
        alt=""
        class="singer-avatar"
      >
      <button
        v-if="canDel"
        type="button"
        class="del-btn"
        title="移除"
        @click.stop="PLstore.removeSinger(singerMid)"
      >
        <div class="i-tabler:trash" />
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
/* 名录行：一列人名，靠字重字号分层 */
.singer-row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 10px 12px;
  border-bottom: 1px solid var(--eno-border);
  cursor: pointer;
}

.avatar-wrap {
  position: relative;
  width: 56px;
  height: 56px;
}

.singer-avatar {
  width: 56px;
  height: 56px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-md);
  object-fit: cover;
  transition: border-color 0.16s var(--eno-ease);
}

.singer-row:hover .singer-avatar {
  border-color: rgb(240 235 221 / 30%);
}

.singer-name {
  overflow: hidden;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.singer-desc {
  overflow: hidden;
  color: var(--eno-text-3);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.del-btn {
  position: absolute;
  top: -2px;
  right: -2px;
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: var(--lp-ink-2);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s var(--eno-ease), color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

.group:hover .del-btn,
.del-btn:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.del-btn:hover {
  color: var(--lp-seal-bright);
  background: var(--eno-primary-light);
}

.del-btn:active {
  transform: scale(0.92);
}

@media (prefers-reduced-motion: reduce) {
  .singer-avatar,
  .del-btn {
    transition: none;
    transform: none;
  }
}
</style>
