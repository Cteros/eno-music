<script setup>
const props = defineProps({
  open: Boolean,
  title: String,
})
const emit = defineEmits(['visibleChange'])
const drawerRef = ref(null)

watch(() => props.open, (open) => {
  if (open)
    drawerRef.value.showModal()
  else
    drawerRef.value.close()
})
onMounted(() => {
  drawerRef.value.addEventListener('close', () => {
    emit('visibleChange', false)
  })
})
function close() {
  emit('visibleChange', false)
}
function clickDialog(e) {
  const { clientX, clientY } = e
  const { left, top, right, bottom } = drawerRef.value.getBoundingClientRect()
  if (clientX < left || clientX > right || clientY < top || clientY > bottom)
    close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <dialog
        v-show="open" ref="drawerRef"
        class="bg-$eno-filter-glass-2 backdrop-blur h-screen w-screen
        text-$eno-text-1 m-0 max-w-[100vw] max-h-[100vh] p-6
      " @click="clickDialog"
      >
        <div text-3xl mb-2 class="flex justify-between">
          <div>
            <span v-if="props.title" v-html="props.title" />
          </div>
          <div
            class="i-mingcute:close-fill w-1em h-1em items-center transition-all
          transition-delay-300 hover:transform-rotate-90 cursor-pointer" @click.stop="close"
          />
        </div>
        <div class="h-[calc(100%-3rem)] w-full overflow-auto flex-1">
          <slot />
        </div>
      </dialog>
    </Transition>
  </Teleport>
</template>

<style lang="css" scoped>
/* 从底部滑入动画 */
.slide-up-enter-active {
  animation: slide-up-in 0.3s;
}
.slide-up-leave-active {
  animation: slide-up-out 0.3s;
}
@keyframes slide-up-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes slide-up-out {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}
</style>
