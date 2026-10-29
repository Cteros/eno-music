<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { coverIdentity } from './coverPalette'

const props = defineProps<{
  src: string
  playing?: boolean
}>()

const shown = ref(props.src)
const leaving = ref('')
const entering = ref(false)
let fadeTimer = 0
let enterTimer = 0
let swapToken = 0

function clearTimers() {
  window.clearTimeout(fadeTimer)
  window.clearTimeout(enterTimer)
}

async function reveal(next: string) {
  if (coverIdentity(next) === coverIdentity(shown.value)) {
    shown.value = next
    return
  }
  if (next && coverIdentity(next) === coverIdentity(leaving.value)) {
    clearTimers()
    shown.value = next
    leaving.value = ''
    entering.value = false
    return
  }

  const job = ++swapToken
  if (!shown.value || !next) {
    shown.value = next
    leaving.value = ''
    entering.value = false
    return
  }
  if (next) {
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('cover'))
        image.src = next
      })
    }
    catch {
      // still swap; broken art is better than a stuck previous cover
    }
  }
  if (job !== swapToken)
    return
  clearTimers()
  leaving.value = shown.value
  shown.value = next
  entering.value = true
  await nextTick()
  enterTimer = window.setTimeout(() => {
    entering.value = false
  }, 24)
  fadeTimer = window.setTimeout(() => {
    if (job !== swapToken)
      return
    leaving.value = ''
  }, 420)
}

watch(() => props.src, (next) => {
  void reveal(next)
})

onBeforeUnmount(() => {
  swapToken += 1
  clearTimers()
})
</script>

<template>
  <div
    v-if="shown || leaving"
    class="cover-stage"
    :class="{ 'cover-stage--playing': playing }"
    aria-hidden="true"
  >
    <img
      v-if="leaving"
      class="cover-stage-img cover-stage-img--leave"
      :src="leaving"
      alt=""
    >
    <img
      v-if="shown"
      class="cover-stage-img"
      :class="{ 'cover-stage-img--enter': entering }"
      :src="shown"
      alt=""
    >
    <div class="cover-stage-wash" />
  </div>
</template>

<style scoped>
/* 封面舞台：封套压印在墨底上——不发光、不模糊、不漂移 */
.cover-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.cover-stage-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.12) brightness(0.55);
  opacity: 0.2;
  transition: opacity 0.4s var(--eno-ease);
}

.cover-stage--playing .cover-stage-img:not(.cover-stage-img--leave) {
  opacity: 0.26;
}

.cover-stage-img--leave {
  opacity: 0;
  transition: opacity 0.4s var(--eno-ease);
}

.cover-stage-img--enter {
  opacity: 0;
  animation: none;
  transition: none;
}

.cover-stage-wash {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--eno-cover-wash, var(--lp-ink-2)) 70%, var(--lp-ink-deep));
}

@media (prefers-reduced-motion: reduce) {
  .cover-stage-img,
  .cover-stage-img--leave {
    transition: none;
  }
}
</style>
