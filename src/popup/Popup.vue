<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  PLAYER_CMD,
  PLAYER_PENDING_CMD_KEY,
  PLAYER_STATE_KEY,
  type PlayerPopupState,
  type PlayerRemoteCmd,
  emptyPlayerPopupState,
  formatPlayerTime,
} from '~/shared/playerBridge'

const state = ref<PlayerPopupState>(emptyPlayerPopupState())
const busy = ref(false)
const hint = ref('')

const progressPercent = computed(() => {
  if (!state.value.total)
    return 0
  return Math.max(0, Math.min(1, state.value.current / state.value.total))
})

const progressStyle = computed(() => ({
  width: `${progressPercent.value * 100}%`,
}))

async function refreshState() {
  try {
    const data = await browser.storage.local.get(PLAYER_STATE_KEY)
    const next = data[PLAYER_STATE_KEY] as PlayerPopupState | undefined
    if (next)
      state.value = next
  }
  catch (error) {
    console.warn('[popup] read state failed', error)
  }
}

function onStorageChanged(
  changes: Record<string, { newValue?: PlayerPopupState }>,
  area: string,
) {
  if (area !== 'local' || !changes[PLAYER_STATE_KEY])
    return
  if (changes[PLAYER_STATE_KEY].newValue)
    state.value = changes[PLAYER_STATE_KEY].newValue as PlayerPopupState
}

async function sendCmd(cmd: PlayerRemoteCmd) {
  if (busy.value)
    return
  busy.value = true
  hint.value = ''
  try {
    const response = await browser.runtime.sendMessage({
      type: PLAYER_CMD,
      cmd,
    })
    if (response?.ok) {
      await refreshState()
      return
    }
    throw new Error('no-handler')
  }
  catch {
    await browser.storage.local.set({ [PLAYER_PENDING_CMD_KEY]: cmd })
    hint.value = '正在打开播放器…'
    await browser.runtime.openOptionsPage()
  }
  finally {
    busy.value = false
  }
}

function openFullPlayer() {
  browser.runtime.openOptionsPage()
}

onMounted(async () => {
  await refreshState()
  browser.storage.onChanged.addListener(onStorageChanged)
})

onUnmounted(() => {
  browser.storage.onChanged.removeListener(onStorageChanged)
})
</script>

<template>
  <div class="popup">
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
        :src="state.cover"
        alt=""
      >
      <div v-else class="cover cover--empty">
        <div class="i-tabler:music" />
      </div>
      <div class="meta">
        <div class="title" :title="state.title">
          {{ state.title }}
        </div>
        <div class="author" :title="state.author">
          {{ state.author || (state.hasSong ? '未知歌手' : '在完整页点歌后可在此控制') }}
        </div>
      </div>
    </section>

    <div class="progress">
      <div class="progress-track">
        <div class="progress-fill" :style="progressStyle" />
      </div>
      <div class="time">
        <span>{{ formatPlayerTime(state.current) }}</span>
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

    <p v-if="hint" class="hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.popup {
  box-sizing: border-box;
  width: 320px;
  padding: 12px;
  background: #121212;
  color: #fff;
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
}

.open-btn:hover {
  background: #3be477;
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
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: #282828;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #1ed760;
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
}

.ctrl {
  width: 32px;
  height: 32px;
  font-size: 22px;
  color: #b3b3b3;
}

.ctrl:hover {
  color: #fff;
}

.play {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #fff;
  color: #000;
  font-size: 22px;
}

.play:hover {
  transform: scale(1.04);
}

.ctrl:disabled,
.play:disabled {
  cursor: default;
  opacity: 0.45;
}

.hint {
  margin: 10px 0 0;
  color: #b3b3b3;
  font-size: 11px;
  text-align: center;
}
</style>
