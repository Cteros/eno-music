<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useUiStore } from '~/stores'

defineProps({
  cover: String,
  badge: String,
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
    <div v-show="ui.showVideo" class="video-stage">
      <button
        class="video-close"
        type="button"
        title="关闭视频"
        @click="closeVideo"
      >
        <div class="i-mingcute:close-line" />
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
.video-stage {
  position: fixed;
  inset: 0 0 80px;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

.video-aura {
  position: absolute;
  inset: -18% 0;
  z-index: 0;
  width: 100%;
  height: 136%;
  object-fit: cover;
  filter: blur(64px) saturate(1.45);
  opacity: calc(0.48 + var(--eno-bass, 0) * 0.28);
  pointer-events: none;
}

.video-aura--right {
  inset: auto -8% 0 42%;
  width: auto;
  height: 130%;
  object-position: right center;
  filter: blur(72px) saturate(1.6);
  opacity: calc(0.58 + var(--eno-bass, 0) * 0.32);
  mask-image: linear-gradient(90deg, transparent, #000 28%);
}

.video-live-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: 2px;
  background: #e91429;
  color: #fff;
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
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  font-size: 20px;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.video-close:hover {
  background: rgb(0 0 0 / 75%);
  transform: scale(1.06);
}

.video-close:active {
  transform: scale(0.92);
}

@media (max-width: 900px) {
  .video-stage {
    inset: 0;
  }
}
</style>
