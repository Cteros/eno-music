<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useUiStore } from '~/stores'

defineProps({
  cover: String,
  badge: String,
  split: Boolean,
})

const ui = useUiStore()

function closeVideo() {
  ui.showVideo = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    ui.showVideo = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-show="ui.showVideo" class="video-stage" :class="{ 'video-stage--split': split }">
      <button
        class="video-close"
        type="button"
        title="关闭视频"
        @click="closeVideo"
      >
        <div class="i-tabler:x" />
      </button>
      <img
        v-if="cover"
        class="video-aura"
        :src="cover"
        alt=""
      >
      <img
        v-if="cover"
        class="video-aura video-aura--right"
        :src="cover"
        alt=""
      >
      <span v-if="badge" class="video-live-badge">{{ badge }}</span>
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
/* —— 视频舞台：墨底银幕，上方留出 104px 播放条 —— */
.video-stage {
  position: fixed;
  inset: 0 0 104px;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--lp-ink-deep);
  transition: padding-right 0.28s var(--eno-ease);
}

/* 歌词分栏：视频居中于左列，右列留给歌词 */
.video-stage--split {
  padding-right: 42%;
}

/* 分栏时右上角被歌词列占据，关闭按钮移到视频列左上 */
.video-stage--split .video-close {
  right: auto;
  left: 16px;
}

/* 舞台背景：封面压印，不发光不模糊 */
.video-aura {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.1) brightness(0.5);
  opacity: 0.16;
  pointer-events: none;
}

.video-aura--right {
  display: none;
}

.video-live-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
  color: var(--lp-paper);
  font-family: var(--app-font-sans);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  pointer-events: none;
}

.video-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-1);
  background: rgb(16 15 19 / 72%);
  font-size: 18px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .video-stage {
    inset: 0;
  }
}
</style>
