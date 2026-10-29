<script setup lang="ts">
import type { DanmakuHit } from './fetchDanmaku'
import { Drawer, LoopSwitch, MessageAPI } from '@cloudfly/eno-ui'
import { useLocalStorage } from '@vueuse/core'
import { useApiClient } from '~/api'
import SongItem from '~/shared/components/SongItem.vue'
import { sendPlayerMessage, songKey } from '~/shared/playerBridge'
import { useEqStore, useLibraryStore, useUiStore } from '~/stores'
import DanmakuOverlay from './DanmakuOverlay.vue'
import { loadDanmakuCached } from './fetchDanmaku'
import useControl from './keys'
import LiveVideo from './LiveVideo.vue'
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
const showDanmakuFloat = useLocalStorage('showDanmakuFloat', true)
const danmakuHits = ref<DanmakuHit[]>([])
const isLive = computed(() => store.play?.eno_song_type === 'live')

// 多源写法：store.play 每次引擎发布都会被新对象覆盖，
// 单 getter 返回数组会让 watch 每 250ms 误触发、把弹幕清空
let danmakuToken = 0

watch(
  [() => store.play?.bvid, () => store.play?.cid],
  async ([bvid, cid]) => {
    const token = ++danmakuToken
    danmakuHits.value = []
    if (!bvid || isLive.value)
      return
    let cidValue = cid
    if (!cidValue) {
      try {
        const info = await useApiClient().blbl.getVideoInfo({ bvid })
        // 补 cid 后复查令牌，避免用旧歌的 cid 去拉新歌的弹幕
        if (token !== danmakuToken)
          return
        cidValue = info?.data?.cid
      }
      catch {
        return
      }
    }
    const hits = await loadDanmakuCached(cidValue)
    if (token !== danmakuToken)
      return
    danmakuHits.value = hits
  },
  { immediate: true },
)

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

const fullScreenStatus = ref(Boolean(document.fullscreenElement))
function syncFullScreen() {
  fullScreenStatus.value = Boolean(document.fullscreenElement)
}
function fullScreenTheBody() {
  if (document.fullscreenElement)
    void document.exitFullscreen()
  else
    void document.body.requestFullscreen()
}
function openBlTab() {
  if (isLive.value && store.play.roomid)
    window.open(`https://live.bilibili.com/${store.play.roomid}`)
  else
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

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullScreen)
  syncFullScreen()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullScreen)
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
          <img class="eno-cover" :class="{ 'eno-cover--playing': isPlaying }" :src="store.play.cover">
          <div class="eno-cover-mask" :class="{ 'eno-cover-mask--on': ui.showVideo }">
            <i :class="ui.showVideo ? 'i-tabler:x text-lg' : 'i-tabler:arrows-maximize text-lg'" />
          </div>
          <span
            v-if="isPlaying"
            class="dock-seal eno-seal eno-seal--round eno-seal--stamp"
            aria-hidden="true"
          >在听</span>
        </span>
        <div class="eno-meta">
          <div class="eno-title">
            <span v-if="isLive" class="eno-live-badge">LIVE</span>
            <span v-html="displayData.title" />
          </div>
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
          <div class="i-tabler:star w-1em h-1em cursor-pointer" title="加入歌单" @click.stop="PLstore.startAddSong(store.play)" />
          <div class="i-tabler:info-circle w-1em h-1em cursor-pointer" title="在 B 站打开" @click.stop="openBlTab" />
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
            :disabled="isLive"
            title="播放速度"
            @click.stop="cycleRate"
          >
            {{ rateLabel }}
          </button>
          <div class="i-tabler:player-track-prev-filled eno-ctrl" @click.stop="change('prev')" />
          <button
            type="button"
            class="eno-play-disc eno-play-main"
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
          <template v-if="isLive">
            <div class="eno-time">
              {{ timeDisplay.current }}
            </div>
            <div class="eno-live-line" />
            <div class="eno-time">
              LIVE
            </div>
          </template>
          <template v-else>
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
          </template>
        </div>
      </div>

      <div class="eno-right">
        <div v-if="isCloseVoice" class="i-tabler:volume-off eno-ctrl" title="取消静音" @click.stop="setVoice" />
        <div v-else class="i-tabler:volume eno-ctrl" title="静音" @click.stop="setVoice" />
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
          v-if="!isLive"
          class="eno-toggle-group"
          role="group"
          aria-label="歌词与弹幕"
        >
          <button
            type="button"
            class="eno-toggle"
            :class="{ 'eno-toggle--on': showLyrics }"
            title="歌词"
            @click.stop="showLyrics = !showLyrics"
          >
            词
          </button>
          <button
            type="button"
            class="eno-toggle"
            :class="{ 'eno-toggle--on': showDanmakuFloat }"
            title="弹幕"
            @click.stop="showDanmakuFloat = !showDanmakuFloat"
          >
            弹
          </button>
        </div>
        <div class="i-tabler:playlist eno-ctrl" @click="toggleList" />
        <div
          v-if="fullScreenStatus"
          class="i-tabler:arrows-minimize eno-ctrl"
          title="退出全屏"
          @click.stop="fullScreenTheBody"
        />
        <div
          v-else
          class="i-tabler:arrows-maximize eno-ctrl"
          title="进入全屏"
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
    <!-- 歌词开启时：全屏视频左侧、歌词右侧分栏 -->
    <Lyrics
      v-if="showLyrics && !isLive"
      :layout="ui.showVideo ? 'split' : 'overlay'"
      :bvid="store.play.bvid"
      :cid="store.play.cid"
      :current="progress.current"
      :crowd="danmakuHits"
    />
    <DanmakuOverlay
      :hits="danmakuHits"
      :current="progress.current"
      :split="showLyrics && ui.showVideo"
      :enabled="showDanmakuFloat && ui.showVideo && !isLive"
    />
    <LiveVideo
      v-if="ui.showVideo && isLive"
      :session="store.play.roomid || store.play.id"
      :cover="store.play.cover"
    />
    <Video
      v-else-if="ui.showVideo"
      :is-playing="isPlaying"
      :is-dragging="isDragging"
      :video-url="store.play.video"
      :song="store.play"
      :cover="store.play.cover"
      :audio-time="progress.current"
      :audio-rate="rate"
      :lyrics-open="showLyrics"
    />
  </section>
</template>

<style scoped>
/* —— 播放条：内页书页的页脚（dock 总高 104px，与 App 壳层对齐）—— */
.eno-player {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  height: 104px;
  border-top: 3px double rgb(240 235 221 / 38%);
  background: var(--lp-ink-2);
}

.eno-player-shell {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(360px, 1.6fr) minmax(240px, 1fr);
  width: 100%;
  height: 100%;
  padding: 0 32px;
  align-items: center;
  gap: 24px;
  color: var(--eno-text-1);
}

/* —— 左：封套小图 + 曲名宋体大字 —— */
.eno-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14px;
}

.eno-cover {
  display: block;
  width: 66px;
  height: 66px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
  transition: border-color 0.18s var(--eno-ease);
}

.eno-cover--playing {
  border-color: rgb(217 86 74 / 45%);
}

/* 封面角落的「在听」朱印：与曲目行同一枚章 */
.dock-seal {
  position: absolute;
  right: -8px;
  bottom: -8px;
  z-index: 2;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-indent: 0.08em;
  pointer-events: none;
}

.eno-cover-mask {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  border-radius: var(--eno-radius-sm);
  background: rgb(16 15 19 / 66%);
  color: var(--lp-paper);
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
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  color: var(--eno-text-1);
  font-family: var(--app-font-display);
  font-size: 23px;
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1.2;
  white-space: nowrap;
}

.eno-title > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eno-live-badge {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
  color: var(--lp-paper);
  font-family: var(--app-font-sans);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.eno-live-line {
  flex: 1;
  height: 3px;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-seal);
}

.eno-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.eno-author span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eno-retry {
  flex-shrink: 0;
  height: 20px;
  padding: 0 8px;
  border: 1px solid var(--lp-seal-bright);
  border-radius: var(--eno-radius-sm);
  background: transparent;
  color: var(--lp-seal-bright);
  font-family: var(--app-font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), color 0.16s var(--eno-ease);
}

.eno-retry:hover {
  background: var(--eno-primary-light);
}

.eno-mini-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--eno-text-3);
  font-size: 17px;
}

.eno-mini-actions > * {
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease);
}

.eno-mini-actions > *:hover {
  color: var(--eno-text-1);
}

.eno-mini-actions > *:active {
  transform: scale(0.92);
}

/* —— 中：走带与朱红细进度线 —— */
.eno-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.eno-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: var(--eno-text-2);
}

.eno-controls :deep(.eu-loop-switch) {
  font-size: 21px;
}

.eno-ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: var(--eno-text-2);
  font-size: 21px;
  cursor: pointer;
}

.eno-rate {
  min-width: 40px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: transparent;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.eno-rate:hover {
  background: var(--eno-fill-1);
  color: var(--eno-text-1);
  transform: none;
}

.eno-rate.eno-rate--on,
.eno-rate.eno-rate--on:hover {
  border-color: rgb(217 86 74 / 55%);
  background: var(--eno-primary-light);
  color: var(--lp-seal-bright);
}

button.eno-play-main {
  width: 52px;
  height: 52px;
}

button.eno-play-main .eno-play-icon {
  display: block;
  width: 22px;
  height: 22px;
}

.eno-progress {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 12px;
}

.eno-time {
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 11px;
  letter-spacing: 0.02em;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.eno-progress-track {
  position: relative;
  display: flex;
  width: 100%;
  height: 14px;
  align-items: center;
}

.eno-progress-track::before {
  content: '';
  width: 100%;
  height: 3px;
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-3);
}

.eno-progress-fill {
  position: absolute;
  left: 0;
  height: 3px;
  border-radius: var(--eno-radius-sm);
  background: var(--eno-primary);
  transition: background-color 0.16s var(--eno-ease);
}

.eno-progress-track:hover .eno-progress-fill {
  background: var(--lp-seal-bright);
}

.eno-progress-range {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 14px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

/* —— 右：音量、定时、词/弹、队列 —— */
.eno-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type='range']::-webkit-slider-runnable-track {
  height: 3px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-3);
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  margin-top: -4.5px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-paper);
  transition: transform 0.12s var(--eno-ease);
}

input[type='range']:hover::-webkit-slider-thumb {
  transform: scale(1.15);
}

input[type='range']::-moz-range-track {
  height: 3px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-3);
}

input[type='range']::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: none;
  border-radius: var(--eno-radius-sm);
  background: var(--lp-paper);
}

/* 音量条：轨道留空，让引擎注入的朱红/墨色分段渐变透出来 */
.eno-volume-range {
  width: 96px;
  height: 4px;
}

.eno-volume-range::-webkit-slider-runnable-track {
  height: 4px;
  background: transparent;
}

.eno-volume-range::-webkit-slider-thumb {
  margin-top: -4px;
}

.eno-volume-range::-moz-range-track {
  background: transparent;
}

/* 右下角「词 / 弹」分段开关：方角纸片 */
.eno-toggle-group {
  display: inline-flex;
  height: 26px;
  padding: 2px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-1);
  overflow: hidden;
}

.eno-toggle {
  min-width: 32px;
  height: 100%;
  padding: 0 8px;
  border: 0;
  border-radius: 1px;
  background: transparent;
  color: var(--eno-text-3);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: color 0.14s var(--eno-ease), background-color 0.14s var(--eno-ease);
}

.eno-toggle:hover {
  color: var(--eno-text-1);
}

.eno-toggle--on {
  background: var(--eno-primary-light);
  color: var(--lp-seal-bright);
}

.eno-toggle--on:hover {
  color: var(--lp-seal-bright);
}

.queue-ops {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.queue-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-1);
  color: var(--eno-text-2);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
}

@media (max-width: 1200px) {
  .eno-player-shell {
    grid-template-columns: minmax(200px, 1fr) minmax(300px, 1.3fr) minmax(180px, 1fr);
    gap: 14px;
  }

  .eno-cover {
    width: 56px;
    height: 56px;
  }

  .eno-title {
    font-size: 20px;
  }

  .eno-volume-range {
    width: 72px;
  }
}

@media (max-width: 900px) {
  .eno-player-shell {
    grid-template-columns: 1fr;
    height: auto;
    padding: 0 12px;
  }

  .eno-left,
  .eno-right {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .eno-cover,
  .eno-retry,
  .eno-rate,
  .eno-toggle,
  .eno-mini-actions > * {
    transition: none;
  }
}
</style>
