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
  createStateOrder,
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
const acceptState = createStateOrder()

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
    background: `linear-gradient(to right, var(--lp-seal) 0 ${percent}, var(--eno-fill-3) ${percent} 100%)`,
  }
})

function applyState(next?: PlayerPopupState) {
  if (!next)
    return
  if (!acceptState(next))
    return
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
    const next = data[PLAYER_STATE_KEY] as PlayerPopupState | undefined
    if (next)
      applyState(next)
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
          <div class="i-tabler:disc brand-icon" />
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
        <button type="button" class="play eno-play-disc" aria-label="播放/暂停" :disabled="busy" @click="sendCmd('toggle')">
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
          <span v-if="state.volume > 0" class="i-tabler:volume-2" />
          <span v-else class="i-tabler:volume-off" />
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
/* 工具栏遥控面：墨底细线，任务密度优先 */
:global(html),
:global(body),
:global(#app) {
  min-height: 0;
  width: 320px;
}

.popup {
  position: relative;
  box-sizing: border-box;
  width: 320px;
  overflow: visible;
  padding: 0;
  color: var(--eno-text-1);
  background: var(--lp-ink-deep);
  font-family: var(--app-font-sans);
}

.popup-body {
  position: relative;
  z-index: 1;
  padding: 12px 14px 14px;
}

.popup-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--eno-border);
}

.brand {
  display: flex;
  gap: 7px;
  align-items: center;
  font-family: var(--app-font-display);
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.brand-icon {
  width: 15px;
  height: 15px;
  color: var(--lp-seal-bright);
  font-size: 15px;
}

.open-btn {
  display: inline-flex;
  height: 26px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.open-btn:hover {
  color: var(--eno-text-1);
  background: var(--eno-fill-2);
  transform: none;
}

.now {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.cover {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
  background: var(--lp-ink-2);
}

/* 播放中：封面同章呼应 */
.cover--playing {
  border: 2px solid var(--lp-seal-bright);
}

.cover--empty {
  display: grid;
  place-items: center;
  color: var(--eno-text-3);
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

/* 宋体曲名 */
.title {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.live-badge {
  flex-shrink: 0;
  margin-right: 6px;
  padding: 0 5px;
  border: 1px solid var(--lp-seal-bright);
  border-radius: var(--eno-radius-sm);
  color: var(--lp-seal-bright);
  font-family: var(--app-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 16px;
}

.author {
  color: var(--eno-text-3);
  font-size: 12px;
}

.progress {
  margin-bottom: 10px;
}

.progress-track {
  position: relative;
  height: 3px;
  overflow: visible;
  border-radius: 2px;
  background: var(--eno-fill-3);
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--lp-seal);
}

.progress-fill--live {
  width: 100%;
  background: var(--lp-seal-bright);
}

.progress-range {
  position: absolute;
  inset: -5px 0;
  width: 100%;
  height: 13px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

input[type='range'] {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
}

.time {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  color: var(--eno-text-3);
  font-family: var(--app-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.controls {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.ctrl {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  color: var(--eno-text-2);
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.play {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  font-size: 22px;
}

.volume {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}

.mute {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: 0;
  color: var(--eno-text-2);
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}

.volume-range {
  flex: 1;
  height: 4px;
  min-width: 0;
}

.volume-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: transparent;
}

.volume-range::-webkit-slider-thumb {
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border: 0;
  border-radius: 2px;
  background: var(--lp-paper);
  -webkit-appearance: none;
}

.extras {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--eno-border);
}

.loop {
  display: grid;
  width: 28px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: 0;
  color: var(--eno-text-2);
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}

.rate {
  min-width: 40px;
  height: 22px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: transparent;
  font-family: var(--app-font-mono);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.loop--on,
.loop--on:hover,
.rate--on,
.rate--on:hover {
  color: var(--lp-seal-bright);
}

.hint {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin: 10px 0 0;
  color: var(--eno-text-3);
  font-size: 11px;
  text-align: center;
}

.retry {
  display: inline-flex;
  height: 20px;
  align-items: center;
  padding: 0 8px;
  border: 0;
  border-radius: var(--eno-radius-sm);
  color: var(--lp-paper);
  background: var(--eno-primary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
</style>
