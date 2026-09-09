<script setup lang="ts">
import type { PlayerEnvelope, PlayerPopupState, PlayerRemoteCmd } from '~/shared/playerBridge'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CoverStage from '~/features/player/CoverStage.vue'
import SleepTimer from '~/features/player/SleepTimer.vue'
import { useCoverVisual } from '~/features/player/useCoverVisual'
import {
  chromeRuntime,
  chromeStorageLocal,
  offChromeStorageChanged,
  offExtMessage,
  onChromeStorageChanged,
  onExtMessage,
} from '~/shared/chromeApi'
import {
  emptyPlayerPopupState,
  formatPlaybackRate,
  formatPlayerTime,
  loopModeLabel,
  nextLoopMode,
  nextPlaybackRate,
  PLAYER_STATE_KEY,
  sendPlayerMessage,
} from '~/shared/playerBridge'

const state = ref<PlayerPopupState>(emptyPlayerPopupState())
const busy = ref(false)
const hint = ref('')
const dragging = ref(false)
const dragRatio = ref(0)
const draggingVoice = ref(false)
const voiceDraft = ref(1)
const { root, coverSrc } = useCoverVisual(() => state.value.cover)
let lastVoice = 1
let appliedAt = 0

const progressPercent = computed(() => {
  if (dragging.value)
    return dragRatio.value
  if (!state.value.total)
    return 0
  return Math.max(0, Math.min(1, state.value.current / state.value.total))
})

const progressStyle = computed(() => ({
  width: `${progressPercent.value * 100}%`,
}))

const volumeStyle = computed(() => {
  const percent = `${Math.round(Math.max(0, Math.min(1, state.value.volume)) * 100)}%`
  return {
    background: `linear-gradient(to right, #1ed760 0 ${percent}, #4d4d4d ${percent} 100%)`,
  }
})

function applyState(next?: PlayerPopupState) {
  if (!next)
    return
  if (next.updatedAt && next.updatedAt < appliedAt)
    return
  appliedAt = next.updatedAt || Date.now()
  if (typeof next.volume === 'number' && next.volume > 0)
    lastVoice = next.volume
  if (draggingVoice.value)
    state.value = { ...next, volume: voiceDraft.value }
  else
    state.value = next
}

async function refreshState() {
  try {
    const data = await chromeStorageLocal().get(PLAYER_STATE_KEY)
    applyState(data[PLAYER_STATE_KEY] as PlayerPopupState | undefined)
  }
  catch (error) {
    console.warn('[popup] read state failed', error)
  }
}

function onStorageChanged(
  changes: Record<string, { newValue?: unknown }>,
  area: string,
) {
  if (area !== 'local' || !changes[PLAYER_STATE_KEY])
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

async function sendRemote(payload: Parameters<typeof sendPlayerMessage>[0], lock = true) {
  if (lock && busy.value)
    return
  if (lock)
    busy.value = true
  hint.value = ''
  try {
    const response = await sendPlayerMessage(payload)
    if (response?.ok) {
      if (response.state)
        applyState(response.state)
      else
        await refreshState()
      return
    }
    hint.value = response?.error || '播放器未就绪'
  }
  catch (error) {
    console.warn('[popup] cmd failed', error)
    hint.value = '控制失败，请稍后重试'
  }
  finally {
    if (lock)
      busy.value = false
  }
}

function sendCmd(cmd: PlayerRemoteCmd) {
  return sendRemote({
    type: 'ENO_PLAYER_CMD',
    cmd,
  })
}

function cycleRate() {
  return sendRemote({
    type: 'ENO_PLAYER_SET_RATE',
    rate: nextPlaybackRate(state.value.rate),
  })
}

function setSleep(minutes = 0, afterCurrent = false) {
  return sendRemote({
    type: 'ENO_PLAYER_SET_SLEEP',
    sleepMinutes: minutes,
    sleepAfterCurrent: afterCurrent,
  })
}

function cycleLoop() {
  return sendRemote({
    type: 'ENO_PLAYER_SET_LOOP',
    loopMode: nextLoopMode(state.value.loopMode),
  })
}

function onSeekInput(event: Event) {
  dragging.value = true
  dragRatio.value = Number((event.target as HTMLInputElement).value)
}

function onSeekChange(event: Event) {
  const ratio = Number((event.target as HTMLInputElement).value)
  dragging.value = false
  dragRatio.value = ratio
  return sendRemote({
    type: 'ENO_PLAYER_SEEK',
    seekRatio: ratio,
  }, false)
}

function onVoiceInput(event: Event) {
  draggingVoice.value = true
  voiceDraft.value = Number((event.target as HTMLInputElement).value)
  state.value = { ...state.value, volume: voiceDraft.value }
}

function onVoiceChange(event: Event) {
  const volume = Number((event.target as HTMLInputElement).value)
  draggingVoice.value = false
  voiceDraft.value = volume
  if (volume > 0)
    lastVoice = volume
  return sendRemote({
    type: 'ENO_PLAYER_VOLUME',
    volume,
  }, false)
}

function toggleMute() {
  const next = state.value.volume > 0 ? 0 : (lastVoice || 1)
  return sendRemote({
    type: 'ENO_PLAYER_VOLUME',
    volume: next,
  }, false)
}

function retryPlay() {
  return sendRemote({
    type: 'ENO_PLAYER_CMD',
    cmd: 'retry',
  })
}

function openFullPlayer() {
  chromeRuntime().openOptionsPage()
}

onMounted(async () => {
  await refreshState()
  onExtMessage(onPlayerBroadcast)
  onChromeStorageChanged(onStorageChanged)
})

onUnmounted(() => {
  offExtMessage(onPlayerBroadcast)
  offChromeStorageChanged(onStorageChanged)
})
</script>

<template>
  <div ref="root" class="popup">
    <CoverStage :src="coverSrc" :playing="state.isPlaying" />
    <div class="popup-body">
      <header class="popup-head">
        <div class="brand">
          <div class="i-mingcute:disc-fill brand-icon" />
          <span>ENO-M</span>
        </div>
        <button type="button" class="open-btn" @click="openFullPlayer">
          打开完整播放器
        </button>
      </header>

      <section class="now">
        <img
          v-if="state.cover"
          class="cover"
          :class="{ 'cover--playing': state.isPlaying }"
          :src="state.cover"
          alt=""
        >
        <div v-else class="cover cover--empty">
          <div class="i-tabler:music" />
        </div>
        <div class="meta">
          <div class="title" :title="state.title">
            <span v-if="state.live" class="live-badge">LIVE</span>
            {{ state.title }}
          </div>
          <div class="author" :title="state.author">
            {{ state.author || (state.hasSong ? '未知歌手' : '在完整页点歌后，关页也能继续播') }}
          </div>
        </div>
      </section>

      <div class="progress">
        <div class="progress-track">
          <div v-if="state.live" class="progress-fill progress-fill--live" />
          <div v-else class="progress-fill" :style="progressStyle" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            class="progress-range"
            :value="progressPercent"
            :disabled="busy || !state.hasSong || state.live"
            @input="onSeekInput"
            @change="onSeekChange"
          >
        </div>
        <div class="time">
          <span>{{ formatPlayerTime(dragging ? dragRatio * state.total : state.current) }}</span>
          <span>{{ formatPlayerTime(state.total) }}</span>
        </div>
      </div>

      <div class="controls">
        <button type="button" class="ctrl" aria-label="上一首" :disabled="busy" @click="sendCmd('prev')">
          <div class="i-tabler:player-track-prev-filled" />
        </button>
        <button type="button" class="play" aria-label="播放/暂停" :disabled="busy" @click="sendCmd('toggle')">
          <div v-if="state.isPlaying" class="i-tabler:player-pause-filled" />
          <div v-else class="i-tabler:player-play-filled" />
        </button>
        <button type="button" class="ctrl" aria-label="下一首" :disabled="busy" @click="sendCmd('next')">
          <div class="i-tabler:player-track-next-filled" />
        </button>
      </div>

      <div class="volume">
        <button
          type="button"
          class="mute"
          :title="state.volume > 0 ? '静音' : '取消静音'"
          @click="toggleMute"
        >
          <span v-if="state.volume > 0" class="i-mingcute:volume-line" />
          <span v-else class="i-mingcute:volume-mute-line" />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          class="volume-range"
          :style="volumeStyle"
          :value="state.volume"
          @input="onVoiceInput"
          @change="onVoiceChange"
        >
      </div>

      <div class="extras">
        <button
          type="button"
          class="loop"
          :class="{ 'loop--on': state.loopMode !== 'list' }"
          :title="loopModeLabel(state.loopMode)"
          :disabled="busy"
          @click="cycleLoop"
        >
          <span v-if="state.loopMode === 'single'" class="i-tabler:repeat-once" />
          <span v-else-if="state.loopMode === 'random'" class="i-tabler:arrows-shuffle" />
          <span v-else class="i-tabler:repeat" />
        </button>
        <button
          type="button"
          class="rate"
          :class="{ 'rate--on': state.rate !== 1 }"
          title="播放速度"
          :disabled="busy"
          @click="cycleRate"
        >
          {{ formatPlaybackRate(state.rate) }}
        </button>
        <SleepTimer
          :sleep-until="state.sleepUntil"
          :sleep-after-current="state.sleepAfterCurrent"
          @set="setSleep"
        />
      </div>

      <p v-if="hint || state.error" class="hint">
        <span>{{ hint || state.error }}</span>
        <button
          v-if="state.error && state.hasSong"
          type="button"
          class="retry"
          :disabled="busy"
          @click="retryPlay"
        >
          重试
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.popup {
  position: relative;
  box-sizing: border-box;
  width: 320px;
  overflow: visible;
  padding: 0;
  background: var(--eno-cover-dim, #121212);
  color: #fff;
}

.popup-body {
  position: relative;
  z-index: 1;
  padding: 12px;
}

.popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.brand-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: #1ed760;
}

.open-btn {
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: #1ed760;
  color: #000;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.open-btn:hover {
  background: #3be477;
  transform: scale(1.05);
}

.open-btn:active {
  transform: scale(0.95);
}

.now {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.cover {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: cover;
  background: #282828;
}

.cover--playing {
  animation: cover-pulse 2.8s ease-in-out infinite;
}

@keyframes cover-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--eno-cover-accent, #1ed760);
  }

  50% {
    box-shadow: 0 0 12px 1px var(--eno-cover-accent, #1ed760);
  }
}

.cover--empty {
  display: grid;
  place-items: center;
  color: #7c7c7c;
  font-size: 22px;
}

.meta {
  min-width: 0;
  flex: 1;
}

.title,
.author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
}

.author {
  color: #b3b3b3;
  font-size: 12px;
}

.progress {
  margin-bottom: 10px;
}

.progress-track {
  position: relative;
  height: 4px;
  overflow: visible;
  border-radius: 999px;
  background: #282828;
}

.progress-fill--live {
  width: 100%;
  background: #e91429;
}

.live-badge {
  margin-right: 6px;
  padding: 1px 5px;
  border-radius: 2px;
  background: #e91429;
  font-size: 10px;
  font-weight: 800;
}

.progress-range {
  position: absolute;
  inset: -4px 0;
  width: 100%;
  height: 12px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.time {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: #7c7c7c;
  font-size: 11px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.ctrl,
.play {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.ctrl {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #b3b3b3;
}

.ctrl:hover {
  color: #fff;
  transform: scale(1.12);
}

.ctrl:active {
  transform: scale(0.88);
}

.play {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font-size: 22px;
  transition: transform 0.16s var(--eno-ease);
}

.play:hover {
  transform: scale(1.08);
}

.play:active {
  transform: scale(0.94);
}

.ctrl:disabled,
.play:disabled,
.rate:disabled,
.loop:disabled {
  cursor: default;
  opacity: 0.45;
}

.extras {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.volume {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.mute {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #b3b3b3;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.mute:hover {
  color: #fff;
  transform: scale(1.1);
}

.mute:active {
  transform: scale(0.9);
}

.volume-range {
  flex: 1;
  height: 4px;
  min-width: 0;
}

.volume-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: transparent;
}

.volume-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border: 0;
  border-radius: 50%;
  background: #fff;
}

.rate {
  min-width: 40px;
  height: 22px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #b3b3b3;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.rate:hover,
.rate--on {
  color: #1ed760;
}

.rate:hover {
  transform: scale(1.08);
}

.rate:active {
  transform: scale(0.9);
}

.loop {
  display: grid;
  place-items: center;
  width: 28px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #b3b3b3;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.loop:hover,
.loop--on {
  color: #1ed760;
}

.loop:hover {
  transform: scale(1.1);
}

.loop:active {
  transform: scale(0.9);
}

.hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 10px 0 0;
  color: #b3b3b3;
  font-size: 11px;
  text-align: center;
}

.retry {
  height: 20px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: #1ed760;
  color: #000;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

.retry:hover {
  transform: scale(1.05);
}

.retry:active {
  transform: scale(0.94);
}

.retry:disabled {
  opacity: 0.45;
}
</style>
