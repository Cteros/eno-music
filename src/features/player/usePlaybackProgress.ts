import { computed, reactive, ref } from 'vue'
import { usePlayerStore } from '~/stores'

export function usePlaybackProgress() {
  const store = usePlayerStore()
  const progress = reactive({
    percent: 0,
    current: 0,
    total: 0,
  })
  const isDragging = ref(false)
  const progressTimer = ref<number | null>(null)

  function updateProgess() {
    if (!isDragging.value) {
      progress.current = store.howl.seek()
      progress.percent = progress.current / progress.total
    }
    if (store.howl.playing())
      requestAnimationFrame(updateProgess)
  }

  function changeSeek(number: number) {
    if (!store.play?.id)
      return
    store.howl.pause()

    progress.current = (progress.current + number + progress.total) % progress.total
    store.howl.seek(progress.current)

    store.howl.play()
  }

  function changeProgress(e: Event) {
    if (!store.play?.id)
      return
    const target = e.target as HTMLInputElement
    store.howl.seek(progress.total * Number(target.value))
    isDragging.value = false
  }

  function resetProgress() {
    progress.percent = 0
    progress.current = 0
  }

  const timeDisplay = computed(() => {
    return {
      current: new Date(progress.current * 1000).toISOString().substr(14, 5) || '00:00',
      total: new Date(progress.total * 1000).toISOString().substr(14, 5) || '00:00',
    }
  })

  const progressFillStyle = computed(() => {
    const p = Math.max(0, Math.min(1, progress.percent || 0))
    return {
      width: `${p * 100}%`,
    }
  })

  return {
    progress,
    isDragging,
    progressTimer,
    updateProgess,
    changeSeek,
    changeProgress,
    resetProgress,
    timeDisplay,
    progressFillStyle,
  }
}
