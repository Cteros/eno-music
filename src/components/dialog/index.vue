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
      v-show="open"
      ref="dialogRef"
      class="eno-dialog fadeItem"
      @click="clickDialog"
    >
      <div class="eno-dialog-header">
        <div class="eno-dialog-title">
          {{ props.title }}
        </div>
        <div
          class="i-mingcute:close-line eno-dialog-close"
          @click.stop="close"
        />
      </div>
      <div :class="cn('eno-dialog-body', { 'eno-dialog-body-footer': hasFooter })">
        <slot />
      </div>
      <div v-if="hasFooter" class="eno-dialog-footer">
        <slot name="footer" />
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.eno-dialog {
  width: min(42rem, 64vw);
  min-width: min(34rem, 64vw);
  max-width: 90vw;
  max-height: 78vh;
  margin: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 12%);
  border-radius: 16px;
  color: var(--eno-text-1);
  background:
    radial-gradient(140% 120% at -20% -10%, rgb(255 255 255 / 7%), transparent 46%),
    color-mix(in oklab, var(--eno-elevated), black 3%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 10%),
    0 24px 54px rgb(0 0 0 / 42%);
  backdrop-filter: blur(14px) saturate(115%);
}

.eno-dialog::backdrop {
  background: rgb(0 0 0 / 44%);
  backdrop-filter: blur(2px);
}

.eno-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgb(255 255 255 / 6%);
  background: linear-gradient(180deg, rgb(255 255 255 / 4%), rgb(255 255 255 / 1%));
}

.eno-dialog-title {
  font-size: 1rem;
  font-weight: 640;
  letter-spacing: -0.01em;
  color: var(--eno-text-1);
}

.eno-dialog-close {
  width: 1rem;
  height: 1rem;
  font-size: 1rem;
  color: var(--eno-text-3);
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.eno-dialog-close:hover {
  color: var(--eno-text-1);
  transform: rotate(90deg);
}

.eno-dialog-body {
  flex: 1;
  overflow: auto;
  padding: 0.9rem 1rem;
}

.eno-dialog-body-footer {
  padding-bottom: 0.6rem;
}

.eno-dialog-footer {
  border-top: 1px solid rgb(255 255 255 / 6%);
  padding: 0.75rem 1rem 0.95rem;
  background: linear-gradient(180deg, rgb(255 255 255 / 2%), transparent);
}

@media (max-width: 900px) {
  .eno-dialog {
    width: 94vw;
    min-width: 94vw;
    max-height: 82vh;
    border-radius: 14px;
  }
}
</style>
