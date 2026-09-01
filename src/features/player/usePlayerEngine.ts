import { computed, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Howl } from 'howler'
import { useAudioSource } from './useAudioSource'
import { usePlaybackProgress } from './usePlaybackProgress'
import { useMediaSession } from './useMediaSession'
import { usePlayerStore } from '~/stores'

export function usePlayerEngine() {
  const store = usePlayerStore()
  const { getPlayUrl } = useAudioSource()
  const {
    progress,
    isDragging,
    progressTimer,
    updateProgess,
    changeSeek,
    changeProgress,
    resetProgress,
    timeDisplay,
    progressFillStyle,
  } = usePlaybackProgress()

  const isPlaying = ref(false)
  const historyList = ref<number[]>([])
  const voice = useLocalStorage('voice', 1)
  const isCloseVoice = ref(false)

  const { setMetadata } = useMediaSession({
    prev: () => change('prev'),
    next: () => change('next'),
  })

  function initMusic() {
    const url = store.play.url
    resetProgress()

    if (store.howl) {
      store.howl.stop()
      store.howl.unload()
    }

    const index = store.playList.findIndex(({ id }) => id === store.play.id)
    if (index !== historyList.value.at(-1))
      historyList.value.push(index)

    setMetadata(store.play)

    store.howl = new Howl({
      src: [url],
      html5: true,
      volume: 1,
      mute: false,
      onplay: () => {
        isPlaying.value = true
        progress.total = store.howl.duration()
        requestAnimationFrame(updateProgess)
      },
      onpause: () => {
        isPlaying.value = false
        if (progressTimer.value)
          clearInterval(progressTimer.value)
      },
      onend: () => {
        if (store.loopMode === 'single')
          initMusic()
        else change('next')
      },
    })
    store.howl.play()
    store.howl.volume(voice.value)
    isCloseVoice.value = store.howl.volume() === 0
  }

  function change(type: 'prev' | 'next') {
    let index = historyList.value.at(-1) || 0
    const { playList, loopMode } = store

    if (loopMode === 'random') {
      if (type === 'next') {
        index = Math.floor(Math.random() * playList.length)
      }
      else if (type === 'prev') {
        const remove = historyList.value.splice(-2)
        index = remove[0] || 0
      }
    }
    else {
      const currentLength = playList.length

      if (type === 'next')
        index = (index + 1) % currentLength
      else if (type === 'prev')
        index = (index - 1 + currentLength) % currentLength
    }

    historyList.value.push(index)
    store.play = playList[index]
  }

  async function playControl() {
    if (!store.howl) {
      await getPlayUrl(store.play)
      return initMusic()
    }

    if (isPlaying.value)
      store.howl.pause()
    else
      store.howl.play()
  }

  function handleChangeVoice(e: Event) {
    const target = e.target as HTMLInputElement
    store.howl.volume(target.value)
    voice.value = Number(target.value)
  }

  function setVoice() {
    if (isCloseVoice.value) {
      store.howl.volume(voice.value)
      isCloseVoice.value = false
    }
    else {
      store.howl.volume(0)
      isCloseVoice.value = true
    }
  }

  watch(() => store.play?.id, async () => {
    const currentSong = store.play
    await getPlayUrl(currentSong)
    initMusic()
  })

  const displayData = computed(() => {
    return {
      title: store.play.title || '暂无歌曲',
    }
  })

  const voiceTrackStyle = computed(() => {
    const v = Math.max(0, Math.min(1, Number(voice.value) || 0))
    const p = `${Math.round(v * 100)}%`
    return {
      background: `linear-gradient(to right, var(--eno-primary) 0 ${p}, var(--eno-fill-2) ${p} 100%)`,
    }
  })

  return {
    store,
    isPlaying,
    progress,
    voice,
    isCloseVoice,
    isDragging,
    displayData,
    timeDisplay,
    progressFillStyle,
    voiceTrackStyle,
    changeSeek,
    change,
    changeProgress,
    playControl,
    handleChangeVoice,
    setVoice,
  }
}
