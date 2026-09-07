import { onMounted, onUnmounted } from 'vue'

interface ControlOptions {
  play: () => void
  forward?: () => void
  back?: () => void
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false
  const tag = target.tagName
  return tag === 'INPUT'
    || tag === 'TEXTAREA'
    || tag === 'SELECT'
    || target.isContentEditable
}

function useControl(callbacks: ControlOptions) {
  function onKeydown(event: KeyboardEvent) {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey)
      return
    if (isTypingTarget(event.target))
      return

    if (event.code === 'Space') {
      event.preventDefault()
      callbacks.play()
      return
    }
    if (event.code === 'ArrowRight') {
      event.preventDefault()
      callbacks.forward?.()
      return
    }
    if (event.code === 'ArrowLeft') {
      event.preventDefault()
      callbacks.back?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}

export default useControl
