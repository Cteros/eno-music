<script setup>
import { onMounted } from 'vue'
// 第三方库
import { useLocalStorage } from '@vueuse/core'
import { Howl } from 'howler'
import cn from 'classnames'

// 组件
import SongItem from '../SongItem.vue'
import ShareCard from '../sharecard/index.vue'
// store
import { VIDEO_MODE, useBlblStore } from '../../blbl/store'
import { usePlaylistStore } from '../../playlist/store.ts'
import { EQService, useEqStore } from '../Eq/store'
import Video from './video.vue'
import LoopSwitch from './LoopSwitch.vue'

// hooks & utils
import useControl from './keys'
import NewDrawer from '~/components/drawer/drawer.vue'
import { useApiClient } from '~/composables/api'
import { download } from '~/options/utils.ts'

const PLstore = usePlaylistStore()
const eqStore = useEqStore()
const store = useBlblStore()

const api = useApiClient()

onMounted(() => {
  // 注册系统媒体会话
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', () => change('prev'))
    navigator.mediaSession.setActionHandler('nexttrack', () => change('next'))
  }
})

function getUpUrl(obj) {
  const url1 = obj.baseUrl || ''
  const url2 = obj.backup_url?.[0] || ''
  const url3 = obj.backup_url?.[1] || ''

  // 找到第一个不是https://xy 开头的url
  const urlList = [url1, url2, url3].filter(url => !url.startsWith('https://xy'))
  return urlList[0] || url1
}

const isPlaying = ref(false)
const showList = ref(false)
const historyList = ref([])
const progress = reactive({
  percent: 0,
  current: 0,
  total: 0,
})
const voice = useLocalStorage('voice', 1)
const isCloseVoice = ref(false)
const progressTimer = ref(null)
const isDragging = ref(false)

useControl({
  play: () => playControl(),
  forward: () => changeSeek(10),
  back: () => changeSeek(-10),
})

function changeSeek(number) {
  if (!store.play?.id)
    return
  store.howl.pause()

  progress.current = (progress.current + number + progress.total) % progress.total
  store.howl.seek(progress.current)

  store.howl.play()
}

function updateProgess() {
  if (!isDragging.value) {
    progress.current = store.howl.seek()
    progress.percent = progress.current / progress.total
  }
  if (store.howl.playing())
    requestAnimationFrame(updateProgess)
}

function initMusic() {
  const url = store.play.url
  // 重置进度
  progress.percent = 0
  progress.current = 0

  if (store.howl) {
    store.howl.stop()
    store.howl.unload()
  }

  // 判断当前歌曲是否在播放列表中，如果不在就插入，用于点击歌曲播放时防止 history 无法记录
  const index = store.playList.findIndex(({ id }) => id === store.play.id)
  if (index !== historyList.value.at(-1)) {
    historyList.value.push(index)
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: store.play.title,
      artist: store.play.author,
      album: store.play.album,
      artwork: [{ src: store.play.cover }],
    })
  }

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
async function getBvidUrl(item) {
  const { cid } = await api.blbl.getVideoInfo({
    bvid: item.bvid,
  }).then(res => res.data)

  const dash = await api.blbl.getAudioOfVideo({
    cid,
    bvid: item.bvid,
  }).then(res => res.data.dash)

  const url = getUpUrl(dash.audio[0])
  const video = getUpUrl(dash.video[0])

  return {
    ...item,
    url,
    video,
    dash,
  }
}
async function getCidUrl(item) {
  const dash = await api.blbl.getAudioOfVideo({
    cid: item.cid,
    bvid: item.bvid,
  }).then(res => res.data.dash)

  const url = getUpUrl(dash.audio[0])
  const video = getUpUrl(dash.video[0])

  return {
    ...item,
    url,
    video,
    dash,
  }
}
async function getSidUrl(item) {
  const url = await api.blbl.getSong({
    sid: item.id,
  }).then(res => res.data.cdns[0])

  return {
    ...item,
    url,
  }
}

async function getPlayUrl(currentSong) {
  const play = currentSong.eno_song_type === 'bvid'
    ? await getBvidUrl(currentSong)
    : currentSong.eno_song_type === 'cid'
      ? await getCidUrl(currentSong)
      : await getSidUrl(currentSong)
  store.play = play
}

// 监听歌曲切换
watch(() => store.play?.id, async () => {
  const currentSong = store.play
  await getPlayUrl(currentSong)
  initMusic()
})
// 顺序切换
function change(type) {
  let index = historyList.value.at(-1) || 0
  const { playList, loopMode } = store

  if (loopMode === 'random') {
    if (type === 'next') {
      index = Math.floor(Math.random() * playList.length)
    }
    else if (type === 'prev') {
      // 移除最后两个，并播放上一个
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
function changeProgress(e) {
  // 如果当前没有歌曲,就返回
  if (!store.play?.id)
    return
  store.howl.seek(progress.total * e.target.value)
  isDragging.value = false
}

function toggleList() {
  showList.value = !showList.value
}

function deleteSong(index) {
  store.playList.splice(index, 1)
}

const displayData = computed(() => {
  return {
    title: store.play.title || '暂无歌曲',
  }
})

async function playControl() {
  // 当前未播放，点击加载音乐
  if (!store.howl) {
    await getPlayUrl(store.play)
    return initMusic()
  }

  if (isPlaying.value)
    store.howl.pause()
  else
    store.howl.play()
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
const voiceTrackStyle = computed(() => {
  const v = Math.max(0, Math.min(1, Number(voice.value) || 0))
  const p = `${Math.round(v * 100)}%`
  return {
    background: `linear-gradient(to right, var(--eno-primary) 0 ${p}, var(--eno-fill-2) ${p} 100%)`,
  }
})
function handleChangeVoice(e) {
  store.howl.volume(e.target.value)
  voice.value = e.target.value
}
// 设置打开声音和静音
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
const fullScreenStatus = ref(false)
function fullScreenTheBody() {
  // 切换全屏状态
  if (document.fullscreenElement)
    document.exitFullscreen()
  else
    document.body.requestFullscreen()

  fullScreenStatus.value = document.fullscreenElement
}
function openBlTab() {
  window.open(`https://www.bilibili.com/video/${store.play.bvid}`)
}
function changeVideoMode() {
  store.videoMode = store.videoMode === VIDEO_MODE.FLOATING ? VIDEO_MODE.DRAWER : VIDEO_MODE.FLOATING
}
// 初始化eq
watch(() => store.howl, () => {
  if (store.howl) {
    store.eqService = new EQService()
  }
})
watch(() => eqStore.currentPreset, () => {
  if (store.eqService) {
    store.eqService.updateFilters(eqStore.values)
  }
})
</script>

<template>
  <section
    class="eno-player w-screen h-18 flex z-10"
    pos="fixed bottom-0 left-0" transform-gpu
  >
    <img v-if="store.play" :src="store.play.cover" class="absolute inset-0 w-full h-full object-cover opacity-8 pointer-events-none">
    <div class="eno-player-shell">
      <div class="eno-left">
        <span
          v-if="store.play.cover"
          relative shrink-0 cursor-pointer class="group"
          @click.stop="changeVideoMode"
        >
          <img class="eno-cover" :src="store.play.cover">
          <div class="eno-cover-mask">
            <i i-mingcute:arrows-up-fill :class="cn('text-lg', { 'rotate-180': store.videoMode === VIDEO_MODE.FLOATING })" />
          </div>
        </span>
        <div class="eno-meta">
          <div class="eno-title" v-html="displayData.title" />
          <div class="eno-author">
            {{ store.play.author }}{{ store.play.description }}
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
          <LoopSwitch />
          <div class="i-tabler:player-track-prev-filled eno-ctrl" @click.stop="change('prev')" />
          <div
            v-if="isPlaying"
            class="i-tabler:player-pause-filled eno-ctrl eno-ctrl-main"
            @click.stop="playControl"
          />
          <div
            v-else
            class="i-tabler:player-play-filled eno-ctrl eno-ctrl-main"
            @click.stop="playControl"
          />
          <div class="i-tabler:player-track-next-filled eno-ctrl" @click.stop="change('next')" />
        </div>

        <div class="eno-progress">
          <div class="eno-time">{{ timeDisplay.current }}</div>
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
          <div class="eno-time">{{ timeDisplay.total }}</div>
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
        <div hidden class="i-mingcute:download-3-fill eno-ctrl" @click.stop="download(store.play)" />
        <NewDrawer :open="showList" title="播放列表" position="right" @visible-change="vis => showList = vis">
          <div class="w-100">
            <SongItem v-for="(song, index) in store.playList" :key="song.id" show-active del :song="song" size="mini" @deleteSong="deleteSong(index)" />
          </div>
        </NewDrawer>
      </div>
    </div>
    <Video
      v-if="store.videoMode !== VIDEO_MODE.HIDDEN"
      :is-playing="isPlaying"
      :video-url="store.play.video"
    />
  </section>
</template>

<style>
.eno-player {
  border-top: 1px solid var(--eno-border);
}

.eno-player-shell {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(460px, 1.4fr) minmax(280px, 1fr);
  width: 100%;
  height: 100%;
  padding: 7px 14px;
  align-items: center;
  gap: 12px;
  color: var(--eno-text-1);
  background: color-mix(in oklab, var(--eno-elevated), black 4%);
  backdrop-filter: var(--eno-filter-glass-light-1);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 3%);
}

.eno-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.eno-cover {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: cover;
}

.eno-cover-mask {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 35%);
}

.group:hover .eno-cover-mask {
  display: flex;
}

.eno-meta {
  min-width: 0;
  flex: 1;
}

.eno-title {
  font-size: 14px;
  font-weight: 620;
  line-height: 1.15;
  color: var(--eno-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eno-author {
  margin-top: 2px;
  font-size: 12px;
  color: var(--eno-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eno-mini-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--eno-text-2);
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
  gap: 10px;
}

.eno-ctrl {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--eno-text-2);
  cursor: pointer;
  transition: color 0.2s var(--eno-ease), transform 0.2s var(--eno-ease);
}

.eno-ctrl:hover {
  color: var(--eno-text-1);
}

.eno-ctrl:active {
  transform: translateY(1px);
}

.eno-ctrl-main {
  font-size: 30px;
  color: var(--eno-text-1);
}

.eno-progress {
  display: grid;
  grid-template-columns: 46px 1fr 46px;
  align-items: center;
  gap: 8px;
}

.eno-time {
  font-size: 11px;
  font-weight: 650;
  color: var(--eno-text-3);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.eno-progress-track {
  position: relative;
  width: 100%;
  height: 14px;
  display: flex;
  align-items: center;
}

.eno-progress-track::before {
  content: '';
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: var(--eno-fill-2);
}

.eno-progress-fill {
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 999px;
  background: var(--eno-primary);
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

.eno-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.eno-volume-range {
  width: 130px;
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
  background: var(--eno-fill-2);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--eno-text-1);
  border: 1px solid var(--eno-border);
  margin-top: -4px;
}

input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 6px var(--eno-primary-light);
  transition: 0.2s var(--eno-ease);
}

input[type="range"]::-moz-range-track {
  background: var(--eno-fill-2);
  height: 4px;
  border-radius: 999px;
  border: none;
  outline: none;
}

#voice-progress {
  background: var(--eno-fill-2);
}

@media (max-width: 1200px) {
  .eno-player-shell {
    grid-template-columns: minmax(220px, 1fr) minmax(360px, 1.3fr) minmax(220px, 1fr);
    gap: 8px;
  }

  .eno-volume-range {
    width: 96px;
  }
}

@media (max-width: 900px) {
  .eno-player-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    height: auto;
    padding: 10px 12px;
  }

  .eno-left,
  .eno-right {
    display: none;
  }
}
</style>
