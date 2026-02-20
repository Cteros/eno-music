<script setup lang="ts">
import cn from 'classnames'

const props = defineProps<{
  open: boolean
  title: string
  position: 'top' | 'right' | 'bottom' | 'left'
  class: string
}>()
const emit = defineEmits(['visibleChange'])
const drawerRef = ref<HTMLDialogElement>()

const transitionName = computed(() => {
  return `drawer-${props.position}`
})
const isLR = computed(() => props.position === 'left' || props.position === 'right')
watch(() => props.open, (open) => {
  if (!drawerRef.value)
    return
  if (open)
    drawerRef.value.showModal()
  else
    drawerRef.value.close()
})
onMounted(() => {
  drawerRef.value?.addEventListener('close', () => {
    emit('visibleChange', false)
  })
})
function close() {
  emit('visibleChange', false)
}
function clickDialog(e: MouseEvent) {
  if (!drawerRef.value)
    return
  const { clientX, clientY } = e
  const { left, top, right, bottom } = drawerRef.value?.getBoundingClientRect()
  if (clientX < left || clientX > right || clientY < top || clientY > bottom)
    close()
}
</script>

<template>
  <Teleport to="body">
    <Transition :name="transitionName">
      <dialog
        v-show="open" ref="drawerRef"
        :class="cn(`${props.class} text-$eno-text-1 backdrop-blur grid grid-rows-[3rem_1fr] bg-transparent`, {
          'w-screen min-h-[10vh] max-h-[100vh]': !isLR,
          'h-[100vh+4rem] min-w-100 max-w-[100vw]': isLR,
          'translate-x-[-100%] ml-[100vw]': props.position === 'right',
        })"
        @click="clickDialog"
      >
        <div class="flex justify-between h-full text-2xl px-3">
          <div>
            <span v-if="props.title" v-html="props.title" />
          </div>
          <div
            class="i-mingcute:close-fill items-center transition-all text-xl
          transition-delay-300 hover:transform-rotate-90 cursor-pointer" @click.stop="close"
          />
        </div>
        <div class="max-h-[100%-3rem] overflow-y-auto">
          <slot />
        </div>
      </dialog>
    </Transition>
  </Teleport>
</template>

<style>
@import url(./style.css);
dialog::backdrop {
  backdrop-filter: blur(3px);
}
</style>
