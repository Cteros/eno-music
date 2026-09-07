import type { PlayerEnvelope, PlayerPopupState } from '~/shared/playerBridge'
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  chromeStorageLocal,
  offChromeStorageChanged,
  offExtMessage,
  onChromeStorageChanged,
  onExtMessage,
} from '~/shared/chromeApi'
import {
  emptyPlayerPopupState,
  formatPlaybackRate,
  nextPlaybackRate,
  PLAYER_STATE_KEY,
  sendPlayerMessage,
  songKey,
} from '~/shared/playerBridge'
import { useEqStore, usePlayerStore, useRecentStore } from '~/stores'
import { useMediaSession } from './useMediaSession'

export function usePlayerEngine() {
  const store = usePlayerStore()
  const eqStore = useEqStore()
  const recent = useRecentStore()
  const isPlaying = ref(false)
  const progress = reactive({
    percent: 0,
    current: 0,
    total: 0,
  })
  const isDragging = ref(false)
  const voice = useLocalStorage('voice', 1)
  const isCloseVoice = ref(false)
  const lastError = ref('')
  const rate = ref(1)
  const sleepUntil = ref(0)
  const sleepAfterCurrent = ref(false)
  let remoteSongKey = ''
  let appliedAt = 0
  let sampleCurrent = 0
  let sampleAt = 0
  let samplePlaying = false
  let progressRaf = 0
  let lastRecordedKey = ''

  const { setMetadata } = useMediaSession({
    prev: () => change('prev'),
    next: () => change('next'),
    play: () => {
      void sendPlayerMessage({ type: 'ENO_PLAYER_CMD', cmd: 'play' }).then(result => applyState(result?.state))
    },
    pause: () => {
      void sendPlayerMessage({ type: 'ENO_PLAYER_CMD', cmd: 'pause' }).then(result => applyState(result?.state))
    },
  })

  function syncStorePlay(state: PlayerPopupState) {
    if (!state.hasSong)
      return

    const matched = store.playList.find(item =>
      (state.id != null && state.id !== '' && item?.id === state.id)
      || (state.bvid && item?.bvid === state.bvid),
    )

    if (matched) {
      store.play = {
        ...matched,
        video: state.video || matched.video,
        cover: state.cover || matched.cover,
        title: state.title || matched.title,
        author: state.author || matched.author,
      }
      return
    }

    store.play = {
      ...store.play,
      id: state.id as any,
      bvid: state.bvid as any,
      title: state.title,
      author: state.author,
      cover: state.cover,
      video: state.video || store.play?.video,
    }
  }

  function applyState(state?: PlayerPopupState) {
    if (!state)
      return
    if (state.updatedAt && state.updatedAt < appliedAt)
      return
    appliedAt = state.updatedAt || Date.now()
    isPlaying.value = Boolean(state.isPlaying)
    sampleCurrent = state.current || 0
    sampleAt = state.updatedAt || Date.now()
    samplePlaying = Boolean(state.isPlaying)
    progress.total = state.total || 0
    writeProgress()
    if (typeof state.volume === 'number') {
      voice.value = state.volume
      isCloseVoice.value = state.volume === 0
    }
    if (state.loopMode)
      store.loopMode = state.loopMode
    if (typeof state.rate === 'number' && state.rate > 0)
      rate.value = state.rate
    sleepUntil.value = state.sleepUntil || 0
    sleepAfterCurrent.value = Boolean(state.sleepAfterCurrent)
    lastError.value = state.error || ''
    remoteSongKey = songKey(state)
    syncStorePlay(state)
    if (state.hasSong && remoteSongKey && remoteSongKey !== lastRecordedKey) {
      lastRecordedKey = remoteSongKey
      recent.recordPlay(store.play)
    }
    if (state.hasSong) {
      setMetadata({
        title: state.title,
        author: state.author,
        cover: state.cover,
      })
    }
  }

  function writeProgress() {
    const elapsed = samplePlaying && !isDragging.value
      ? Math.max(0, (Date.now() - sampleAt) / 1000) * (rate.value || 1)
      : 0
    let current = sampleCurrent + elapsed
    if (progress.total > 0)
      current = Math.min(current, progress.total)
    progress.current = current
    if (!isDragging.value)
      progress.percent = progress.total ? current / progress.total : 0
  }

  function loopProgress() {
    writeProgress()
    progressRaf = requestAnimationFrame(loopProgress)
  }

  async function refreshState() {
    try {
      const data = await chromeStorageLocal().get(PLAYER_STATE_KEY)
      applyState((data[PLAYER_STATE_KEY] as PlayerPopupState) || emptyPlayerPopupState())
    }
    catch (error) {
      console.warn('[player] refresh state failed', error)
    }
  }

  function onStorageChanged(
    changes: Record<string, { newValue?: unknown }>,
    area: string,
  ) {
    if (area !== 'local' || !changes[PLAYER_STATE_KEY]?.newValue)
      return
    applyState(changes[PLAYER_STATE_KEY].newValue as PlayerPopupState)
  }

  function onPlayerBroadcast(
    message: unknown,
    _sender: unknown,
    _sendResponse: (response: unknown) => void,
  ) {
    const envelope = message as PlayerEnvelope
    if (envelope?.target !== 'ui' || envelope.type !== 'ENO_PLAYER_STATE')
      return false
    applyState(envelope.state)
    return false
  }

  async function playSongNow() {
    if (!store.play?.id && !store.play?.bvid)
      return
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_PLAY',
      song: store.play,
      playList: store.playList,
      loopMode: store.loopMode,
    })
    applyState(result?.state)
    if (!result?.ok)
      lastError.value = result?.error || '播放失败'
  }

  async function change(type: 'prev' | 'next') {
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_CMD',
      cmd: type,
    })
    applyState(result?.state)
  }

  async function playControl() {
    if (!store.play?.id && !store.play?.bvid) {
      await refreshState()
      return
    }
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_CMD',
      cmd: 'toggle',
    })
    if (!result?.ok) {
      await playSongNow()
      return
    }
    applyState(result?.state)
  }

  async function changeProgress(e: Event) {
    const target = e.target as HTMLInputElement
    isDragging.value = false
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_SEEK',
      seekRatio: Number(target.value),
    })
    applyState(result?.state)
  }

  async function changeSeek(number: number) {
    const next = progress.current + number
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_SEEK',
      seekTo: next,
    })
    applyState(result?.state)
  }

  async function handleChangeVoice(e: Event) {
    const target = e.target as HTMLInputElement
    voice.value = Number(target.value)
    isCloseVoice.value = voice.value === 0
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_VOLUME',
      volume: voice.value,
    })
    applyState(result?.state)
  }

  async function setVoice() {
    const next = isCloseVoice.value ? (voice.value || 1) : 0
    isCloseVoice.value = next === 0
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_VOLUME',
      volume: next,
    })
    applyState(result?.state)
  }

  async function cycleRate() {
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_SET_RATE',
      rate: nextPlaybackRate(rate.value),
    })
    applyState(result?.state)
  }

  async function setSleep(minutes = 0, afterCurrent = false) {
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_SET_SLEEP',
      sleepMinutes: minutes,
      sleepAfterCurrent: afterCurrent,
    })
    applyState(result?.state)
  }

  async function retryPlay() {
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_CMD',
      cmd: 'retry',
    })
    applyState(result?.state)
    if (!result?.ok)
      lastError.value = result?.error || '重试失败'
  }

  watch(
    () => [store.play?.id, store.play?.bvid] as const,
    async ([id, bvid], prev) => {
      if (!id && !bvid)
        return
      if (prev && id === prev[0] && bvid === prev[1])
        return
      if (songKey(store.play) === remoteSongKey)
        return
      await playSongNow()
    },
  )

  watch(() => store.loopMode, async (mode) => {
    const result = await sendPlayerMessage({
      type: 'ENO_PLAYER_SET_LOOP',
      loopMode: mode,
    })
    if (result?.state)
      applyState(result.state)
  })

  watch(() => store.playList.length, async () => {
    await sendPlayerMessage({
      type: 'ENO_PLAYER_SET_PLAYLIST',
      playList: store.playList,
    })
  })

  onMounted(() => {
    onExtMessage(onPlayerBroadcast)
    onChromeStorageChanged(onStorageChanged)
    loopProgress()
    void (async () => {
      await refreshState()
      await sendPlayerMessage({
        type: 'ENO_PLAYER_SET_PLAYLIST',
        playList: store.playList,
      })
      await sendPlayerMessage({
        type: 'ENO_PLAYER_SET_LOOP',
        loopMode: store.loopMode,
      })
      await sendPlayerMessage({
        type: 'ENO_PLAYER_VOLUME',
        volume: voice.value,
      })
      await sendPlayerMessage({
        type: 'ENO_PLAYER_SET_EQ',
        eqValues: [...(eqStore?.values || [])],
      })
    })()
  })

  onUnmounted(() => {
    offExtMessage(onPlayerBroadcast)
    offChromeStorageChanged(onStorageChanged)
    if (progressRaf)
      cancelAnimationFrame(progressRaf)
  })

  const displayData = computed(() => ({
    title: store.play.title || '暂无歌曲',
  }))

  const timeDisplay = computed(() => ({
    current: new Date((progress.current || 0) * 1000).toISOString().substr(14, 5) || '00:00',
    total: new Date((progress.total || 0) * 1000).toISOString().substr(14, 5) || '00:00',
  }))

  const progressFillStyle = computed(() => {
    const p = Math.max(0, Math.min(1, progress.percent || 0))
    return { width: `${p * 100}%` }
  })

  const voiceTrackStyle = computed(() => {
    const v = Math.max(0, Math.min(1, Number(voice.value) || 0))
    const p = `${Math.round(v * 100)}%`
    return {
      background: `linear-gradient(to right, var(--eno-primary) 0 ${p}, var(--eno-fill-2) ${p} 100%)`,
    }
  })

  const rateLabel = computed(() => formatPlaybackRate(rate.value))

  return {
    store,
    isPlaying,
    progress,
    voice,
    isCloseVoice,
    isDragging,
    lastError,
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
    rate,
    rateLabel,
    cycleRate,
    sleepUntil,
    sleepAfterCurrent,
    setSleep,
    retryPlay,
  }
}
