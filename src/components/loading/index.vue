<template>
  <div class="loading" role="status" aria-label="Loading">
    <span class="loading-ring" />
    <span class="loading-dot" />
  </div>
</template>

<style scoped>
.loading {
  position: relative;
  display: inline-flex;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--eno-text-2);
}

.loading-ring {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 2px solid color-mix(in oklab, var(--eno-text-3), transparent 72%);
  border-top-color: var(--eno-primary);
  animation: loading-spin 0.72s linear infinite;
}

.loading-dot {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--eno-primary);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--eno-primary), transparent 70%);
  animation: loading-pulse 1s var(--eno-ease) infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loading-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.68;
    transform: scale(0.82);
  }
}
</style>
