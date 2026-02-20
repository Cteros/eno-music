<script setup>
import cn from 'classnames'

const props = defineProps({
  open: Boolean,
  title: String,
})
const emit = defineEmits(['visibleChange'])
const slots = useSlots()
const dialogRef = ref(null)

watch(() => props.open, (open) => {
  if (open)
    dialogRef.value.showModal()
  else
    dialogRef.value.close()
})
onMounted(() => {
  dialogRef.value.addEventListener('close', () => {
    emit('visibleChange', false)
  })
})
function close() {
  emit('visibleChange', false)
}
function clickDialog(e) {
  const { clientX, clientY } = e
  const { left, top, right, bottom } = dialogRef.value.getBoundingClientRect()
  if (clientX < left || clientX > right || clientY < top || clientY > bottom)
    close()
}
// 判断是否有footer
const hasFooter = computed(() => !!slots.footer)
</script>

<template>
  <Teleport to="body">
    <dialog
      v-show="open" ref="dialogRef" class="bg-$eno-elevated border border-$eno-border backdrop-blur p-3 rounded-lg min-h-[50vh] min-w-1/3 w-1/2
        text-$eno-text-1 fadeItem
      " @click="clickDialog"
    >
      <div text-3xl mb-2 class="flex justify-between">
        <div text-lg>
          {{ props.title }}
        </div>
        <div
          class="i-mingcute:close-fill w-1em h-1em items-center transition-all
          transition-delay-300 hover:transform-rotate-90 cursor-pointer" @click.stop="close"
        />
      </div>
      <div :class="cn('overflow-auto flex-1 p-3', hasFooter ? 'h-[calc(100%-5rem)]' : 'h-[calc(100%-2.5rem)]')">
        <slot />
      </div>
      <slot name="footer" />
    </dialog>
  </Teleport>
</template>
