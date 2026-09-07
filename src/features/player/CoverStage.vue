<script setup lang="ts">
defineProps<{
  src: string
  playing?: boolean
}>()
</script>

<template>
  <div
    v-if="src"
    class="cover-stage"
    :class="{ 'cover-stage--playing': playing }"
    aria-hidden="true"
  >
    <img class="cover-stage-img" :src="src" alt="">
    <div class="cover-stage-wash" />
  </div>
</template>

<style scoped>
.cover-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.cover-stage-img {
  width: 100%;
  height: 120%;
  margin-top: -8%;
  object-fit: cover;
  filter: blur(64px) saturate(1.1);
  transform: scale(1.12);
  opacity: 0.28;
  animation: cover-drift 56s ease-in-out infinite alternate;
}

.cover-stage--playing .cover-stage-img {
  opacity: 0.36;
}

.cover-stage-wash {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--eno-cover-accent, #1ed760) 16%, transparent) 0%, #121212 58%),
    linear-gradient(180deg, rgb(0 0 0 / 12%) 0%, #121212 100%);
}

@keyframes cover-drift {
  from {
    transform: scale(1.12) translate3d(-1.5%, 0, 0);
  }

  to {
    transform: scale(1.2) translate3d(2%, -1.5%, 0);
  }
}
</style>
