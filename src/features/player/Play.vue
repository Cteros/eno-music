<script setup lang="ts">
import { Drawer, LoopSwitch, MessageAPI } from '@cloudfly/eno-ui'
import { useLocalStorage } from '@vueuse/core'
import SongItem from '~/shared/components/SongItem.vue'
import { sendPlayerMessage, songKey } from '~/shared/playerBridge'
import { useEqStore, useLibraryStore, useUiStore } from '~/stores'
import useControl from './keys'
import Lyrics from './Lyrics.vue'
import ShareCard from './ShareCard.vue'
import SleepTimer from './SleepTimer.vue'
import { usePlayerEngine } from './usePlayerEngine'
import Video from './Video.vue'

const PLstore = useLibraryStore()
const eqStore = useEqStore()
const ui = useUiStore()

const {
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
  lastError,
  rate,
  rateLabel,
  cycleRate,
  sleepUntil,
  sleepAfterCurrent,
  setSleep,
  retryPlay,
} = usePlayerEngine()

const showList = ref(false)
const showLyrics = useLocalStorage('showLyrics', false)

useControl({
  play: () => playControl(),
  forward: () => changeSeek(10),
  back: () => changeSeek(-10),
})

function toggleList() {
  showList.value = !showList.value
}

function deleteSong(index: number) {
  store.playList.splice(index, 1)
}

function shuffleQueue() {
  const currentKey = songKey(store.play)
  const rest = store.playList.filter(song => songKey(song) !== currentKey)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = rest[i]
    rest[i] = rest[j]
    rest[j] = swap
  }
  store.playList = currentKey && store.play ? [store.play, ...rest] : rest
  MessageAPI.show({ type: 'success', message: '已打乱当前队列' })
}

function saveQueue() {
  if (!store.playList.length) {
    MessageAPI.show({ type: 'warning', message: '队列是空的' })
    return
  }
  const stamp = new Date()
  const name = `队列 ${stamp.getMonth() + 1}/${stamp.getDate()} ${String(stamp.getHours()).padStart(2, '0')}:${String(stamp.getMinutes()).padStart(2, '0')}`
  PLstore.createPlaylist(name, store.playList.map(song => ({ ...song })))
  MessageAPI.show({ type: 'success', message: `已保存为「${name}」` })
}

const fullScreenStatus = ref(false)
function fullScreenTheBody() {
  if (document.fullscreenElement)
    document.exitFullscreen()
  else
    document.body.requestFullscreen()

  fullScreenStatus.value = document.fullscreenElement
}
function openBlTab() {
  window.open(`https://www.bilibili.com/video/${store.play.bvid}`)
}
function toggleVideo() {
  ui.showVideo = !ui.showVideo
}

watch(() => eqStore.values, (values) => {
  void sendPlayerMessage({
    type: 'ENO_PLAYER_SET_EQ',
    eqValues: [...values],
  })
}, { deep: true })

watch(lastError, (message) => {
  if (message)
    MessageAPI.show({ type: 'error', message })
})
</script>

<template>
  <section class="eno-player">
    <div class="eno-player-shell">
      <div class="eno-left">
        <span
          v-if="store.play.cover"
          relative shrink-0 cursor-pointer class="group"
          :title="ui.showVideo ? '关闭视频' : '打开视频'"
          @click.stop="toggleVideo"
        >
          <img class="eno-cover" :src="store.play.cover">
          <div class="eno-cover-mask" :class="{ 'eno-cover-mask--on': ui.showVideo }">
            <i :class="ui.showVideo ? 'i-mingcute:close-line text-lg' : 'i-mingcute:fullscreen-2-line text-lg'" />
          </div>
        </span>
        <div class="eno-meta">
          <div class="eno-title" v-html="displayData.title" />
          <div class="eno-author">
            <span>{{ store.play.author }}{{ store.play.description }}</span>
            <button
              v-if="lastError"
              type="button"
              class="eno-retry"
              @click.stop="retryPlay"
            >
              重试
            </button>
          </div>
        </div>
        <div class="eno-mini-actions">
          <div class="i-mingcute:star-fill w-1em h-1em cursor-pointer" @click.stop="PLstore.startAddSong(store.play)" />
          <div class="i-mingcute:information-fill w-1em h-1em cursor-pointer" @click.stop="openBlTab" />
          <ShareCard />
        </div>
      </div>

      <div class="eno-center">
        <div class="eno-controls">
          <LoopSwitch v-model="store.loopMode" />
          <button
            type="button"
            class="eno-rate"
            :class="{ 'eno-rate--on': rate !== 1 }"
            title="播放速度"
            @click.stop="cycleRate"
          >
            {{ rateLabel }}
          </button>
          <div class="i-tabler:player-track-prev-filled eno-ctrl" @click.stop="change('prev')" />
          <button
            type="button"
            class="eno-play-btn"
            aria-label="播放/暂停"
            @click.stop="playControl"
          >
            <span
              v-if="isPlaying"
              class="eno-play-icon i-tabler:player-pause-filled"
            />
            <span
              v-else
              class="eno-play-icon i-tabler:player-play-filled"
            />
          </button>
          <div class="i-tabler:player-track-next-filled eno-ctrl" @click.stop="change('next')" />
        </div>

        <div class="eno-progress">
          <div class="eno-time">
            {{ timeDisplay.current }}
          </div>
          <div class="eno-progress-track">
            <div class="eno-progress-fill" :style="progressFillStyle" />
            <input
              v-model="progress.percent"
              type="range"
              min="0"
              max="1"
              step="0.001"
              class="eno-progress-range"
              @input="isDragging = true"
              @change="changeProgress"
            >
          </div>
          <div class="eno-time">
            {{ timeDisplay.total }}
          </div>
        </div>
      </div>

      <div class="eno-right">
        <div v-if="isCloseVoice" class="i-mingcute:volume-mute-line eno-ctrl" @click.stop="setVoice" />
        <div v-else class="i-mingcute:volume-line eno-ctrl" @click.stop="setVoice" />
        <input
          v-if="!isCloseVoice"
          id="voice-progress"
          v-model="voice"
          type="range"
          class="eno-volume-range"
          :style="voiceTrackStyle"
          min="0"
          max="1"
          step="0.01"
          @change="handleChangeVoice"
        >
        <SleepTimer
          :sleep-until="sleepUntil"
          :sleep-after-current="sleepAfterCurrent"
          @set="setSleep"
        />
        <div
          class="i-mingcute:music-2-fill eno-ctrl"
          :class="{ 'eno-ctrl--on': showLyrics }"
          title="歌词"
          @click.stop="showLyrics = !showLyrics"
        />
        <div class="i-tabler:playlist eno-ctrl" @click="toggleList" />
        <div
          v-if="fullScreenStatus"
          class="i-mingcute:fullscreen-fill eno-ctrl"
          @click.stop="fullScreenTheBody"
        />
        <div
          v-else
          class="i-mingcute:fullscreen-exit-fill eno-ctrl"
          @click.stop="fullScreenTheBody"
        />
        <Drawer :open="showList" title="播放列表" position="right" @visible-change="vis => showList = vis">
          <div class="w-100">
            <div class="queue-ops">
              <button type="button" class="queue-btn" @click="shuffleQueue">
                打乱
              </button>
              <button type="button" class="queue-btn" @click="saveQueue">
                存为歌单
              </button>
            </div>
            <SongItem v-for="(song, index) in store.playList" :key="song.id" show-active del :song="song" size="mini" @delete-song="deleteSong(index)" />
          </div>
        </Drawer>
      </div>
    </div>
    <Lyrics
      v-if="showLyrics"
      :bvid="store.play.bvid"
      :cid="store.play.cid"
      :current="progress.current"
    />
    <Video
      v-if="ui.showVideo"
      :is-playing="isPlaying"
      :is-dragging="isDragging"
      :video-url="store.play.video"
      :cover="store.play.cover"
      :audio-time="progress.current"
      :audio-rate="rate"
    />
  </section>
</template>

<style>
.eno-player {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  height: 80px;
  background: #000;
}

.eno-player-shell {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(360px, 1.6fr) minmax(240px, 1fr);
  width: 100%;
  height: 100%;
  padding: 0 16px;
  align-items: center;
  gap: 16px;
  color: #fff;
}

.eno-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.eno-cover {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  object-fit: cover;
}

.eno-cover-mask {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 50%);
}

.group:hover .eno-cover-mask,
.eno-cover-mask--on {
  display: flex;
}

.eno-meta {
  min-width: 0;
  flex: 1;
}

.eno-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.3;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eno-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: #b3b3b3;
}

.eno-author span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eno-retry {
  flex-shrink: 0;
  height: 18px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: #1ed760;
  color: #000;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.eno-mini-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #b3b3b3;
}

.eno-mini-actions > * {
  cursor: pointer;
}

.eno-mini-actions > *:hover {
  color: #fff;
}

.eno-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.eno-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.eno-ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #b3b3b3;
  cursor: pointer;
  transition: color 0.12s var(--eno-ease), transform 0.12s var(--eno-ease);
}

.eno-ctrl:hover {
  color: #fff;
}

.eno-ctrl--on {
  color: #1ed760;
}

.eno-rate {
  min-width: 36px;
  height: 22px;
  padding: 0 6px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #b3b3b3;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.eno-rate:hover,
.eno-rate--on {
  color: #1ed760;
}

.queue-ops {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.queue-btn {
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: #282828;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.queue-btn:hover {
  background: #3e3e3e;
}

button.eno-play-btn {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #000;
  background: #fff;
  background-color: #fff;
  cursor: pointer;
  transition: transform 0.12s var(--eno-ease), background-color 0.12s var(--eno-ease);
}

button.eno-play-btn:hover {
  transform: scale(1.06);
  background: #fff;
  background-color: #fff;
  color: #000;
}

button.eno-play-btn:active {
  transform: scale(1);
}

button.eno-play-btn .eno-play-icon {
  display: block;
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: #000;
  background-color: #000;
}

.eno-progress {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 8px;
}

.eno-time {
  font-size: 11px;
  font-weight: 400;
  color: #a7a7a7;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.eno-progress-track {
  position: relative;
  width: 100%;
  height: 12px;
  display: flex;
  align-items: center;
}

.eno-progress-track::before {
  content: '';
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: #4d4d4d;
}

.eno-progress-fill {
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 999px;
  background: #fff;
}

.eno-progress-track:hover .eno-progress-fill {
  background: #1ed760;
}

.eno-progress-range {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 12px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.eno-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.eno-volume-range {
  width: 93px;
  height: 4px;
  border-radius: 999px;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  border: none;
  outline: none;
  background: #4d4d4d;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: none;
  margin-top: -4px;
}

input[type="range"]::-moz-range-track {
  background: #4d4d4d;
  height: 4px;
  border-radius: 999px;
  border: none;
  outline: none;
}

#voice-progress {
  background: #4d4d4d;
}

@media (max-width: 1200px) {
  .eno-player-shell {
    grid-template-columns: minmax(200px, 1fr) minmax(300px, 1.3fr) minmax(180px, 1fr);
    gap: 8px;
  }

  .eno-volume-range {
    width: 72px;
  }
}

@media (max-width: 900px) {
  .eno-player-shell {
    grid-template-columns: 1fr;
    height: auto;
    padding: 10px 12px;
  }

  .eno-left,
  .eno-right {
    display: none;
  }
}
</style>
