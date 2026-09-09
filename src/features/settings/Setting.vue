<script setup lang="ts">
import { Button, MessageAPI } from '@cloudfly/eno-ui'
import { useLocalStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'
import Eq from '~/features/player/Eq.vue'
import { songKey } from '~/shared/playerBridge'
import { useEqStore, useLibraryStore, usePlayerStore, useRecentStore, useSingerStore, useUiStore } from '~/stores'

const playlistStore = useLibraryStore()
const singerStore = useSingerStore()
const eqStore = useEqStore()
const recent = useRecentStore()
const player = usePlayerStore()
const ui = useUiStore()
const crossfade = useLocalStorage('crossfade', true)

async function openInClient() {
  const cookies = await chrome.cookies.getAll({ domain: '.bilibili.com' })
  const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
  window.open(`eno-m://cookie?cookie=${encodeURIComponent(cookieString)}`)
}

function openAfdian() {
  window.open('https://afdian.com/a/meanc')
}

function readVoice() {
  const raw = localStorage.getItem('voice')
  const value = raw == null ? 1 : Number(JSON.parse(raw))
  return Number.isFinite(value) ? value : 1
}

function writeVoice(value: number) {
  localStorage.setItem('voice', JSON.stringify(value))
}

function collectBackup() {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    singers: singerStore.singers,
    list: playlistStore.list,
    listenLater: playlistStore.listenLater,
    playHistory: recent.playHistory,
    searchHistory: recent.searchHistory,
    eqPreset: eqStore.currentPreset,
    eqValues: [...eqStore.values],
    eqCustomPresets: { ...eqStore.customPresets },
    loopMode: player.loopMode,
    voice: readVoice(),
  }
}

function exportData() {
  const json = JSON.stringify(collectBackup(), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eno-m-backup.json`
  a.click()
  URL.revokeObjectURL(url)
}

function uniqueSongs(list: any[] = []) {
  const seen = new Set<string>()
  const next: any[] = []
  for (const song of list) {
    const key = songKey(song)
    if (key && seen.has(key))
      continue
    if (key)
      seen.add(key)
    next.push(song)
  }
  return next
}

function applyBackup(data: any, merge: boolean) {
  if (!data?.singers || !data?.list) {
    MessageAPI.show({ type: 'warning', message: '数据格式不正确' })
    return false
  }

  if (!merge) {
    singerStore.singers = data.singers
    playlistStore.list = data.list
    if (Array.isArray(data.listenLater))
      playlistStore.listenLater = data.listenLater
    if (Array.isArray(data.playHistory))
      recent.playHistory = data.playHistory
    if (Array.isArray(data.searchHistory))
      recent.searchHistory = data.searchHistory
    if (Array.isArray(data.eqValues))
      eqStore.values = [...data.eqValues]
    if (data.eqPreset)
      eqStore.currentPreset = data.eqPreset
    if (data.eqCustomPresets)
      eqStore.customPresets = { ...data.eqCustomPresets }
    if (data.loopMode)
      player.loopMode = data.loopMode
    if (typeof data.voice === 'number')
      writeVoice(data.voice)
    return true
  }

  const singerSet = new Set(singerStore.singers.map(String))
  for (const mid of data.singers) {
    if (!singerSet.has(String(mid)))
      singerStore.singers.push(String(mid))
  }

  const ids = new Set(playlistStore.list.map(item => String(item.id)))
  for (const playlist of data.list) {
    const next = {
      ...playlist,
      id: ids.has(String(playlist.id)) ? nanoid() : playlist.id,
      songs: uniqueSongs(playlist.songs),
    }
    ids.add(String(next.id))
    playlistStore.list.push(next)
  }

  if (Array.isArray(data.listenLater))
    playlistStore.listenLater = uniqueSongs([...data.listenLater, ...playlistStore.listenLater])
  if (Array.isArray(data.playHistory))
    recent.playHistory = uniqueSongs([...data.playHistory, ...recent.playHistory]).slice(0, 40)
  if (Array.isArray(data.searchHistory)) {
    recent.searchHistory = [...new Set([...data.searchHistory, ...recent.searchHistory])].slice(0, 12)
  }
  return true
}

async function pickBackup() {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{
      description: 'JSON文件',
      accept: { 'application/json': ['.json'] },
    }],
  })
  const fileData = await fileHandle.getFile()
  return JSON.parse(await fileData.text())
}

async function importData(merge = false) {
  try {
    const data = await pickBackup()
    if (!applyBackup(data, merge))
      return
    MessageAPI.show({ type: 'success', message: merge ? '已合并导入' : '导入成功' })
  }
  catch (error) {
    console.error(error)
    MessageAPI.show({ type: 'error', message: '导入失败' })
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-inner">
      <!-- Hero -->
      <div class="settings-hero">
        <div>
          <h1 class="settings-title">
            设置
          </h1>
          <p class="settings-desc">
            管理数据、客户端和关于信息
          </p>
        </div>
      </div>

      <!-- Grid -->
      <div class="settings-grid">
        <!-- Data Card -->
        <div class="settings-card">
          <div class="settings-card__header">
            <span class="i-tabler:database-heart settings-card__icon" />
            <div>
              <div class="settings-card__title">
                数据管理
              </div>
              <div class="settings-card__subtitle">
                导入或导出歌单、歌手、稍后播放、播放历史和均衡器
              </div>
            </div>
          </div>
          <div class="settings-card__body">
            <div class="settings-card__actions">
              <Button variant="secondary" size="sm" @click="exportData">
                <span class="i-tabler:download w-1em h-1em" />
                导出备份
              </Button>
              <Button variant="secondary" size="sm" @click="importData(false)">
                <span class="i-tabler:upload w-1em h-1em" />
                覆盖导入
              </Button>
              <Button variant="secondary" size="sm" @click="importData(true)">
                <span class="i-tabler:git-merge w-1em h-1em" />
                合并导入
              </Button>
            </div>
            <div class="settings-card__notes">
              <p>当前导出的数据包含：</p>
              <ul>
                <li>歌手列表、ENO 歌单</li>
                <li>稍后播放、播放历史、搜索历史</li>
                <li>均衡器预设、循环模式、音量</li>
              </ul>
              <p class="mt-2 text-$eno-text-3">
                覆盖导入会替换当前数据；合并导入会追加歌单和歌手，不改均衡器。
              </p>
            </div>
          </div>
        </div>

        <!-- EQ Card -->
        <div class="settings-card">
          <div class="settings-card__header">
            <span class="i-tabler:adjustments-horizontal settings-card__icon" />
            <div>
              <div class="settings-card__title">
                均衡器
              </div>
              <div class="settings-card__subtitle">
                调节音频频率响应
              </div>
            </div>
          </div>
          <div class="settings-card__body">
            <Eq />
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-card__header">
            <span class="i-tabler:switch-3 settings-card__icon" />
            <div>
              <div class="settings-card__title">
                曲间淡入
              </div>
              <div class="settings-card__subtitle">
                切歌重叠 800 毫秒，失败则硬切
              </div>
            </div>
          </div>
          <div class="settings-card__body">
            <button
              class="xfade-toggle"
              :class="{ 'xfade-toggle--on': crossfade }"
              type="button"
              @click="crossfade = !crossfade"
            >
              <span>{{ crossfade ? '已开启' : '已关闭' }}</span>
              <span class="xfade-knob" />
            </button>
          </div>
        </div>

        <div class="settings-card settings-card--wide">
          <div class="settings-card__header">
            <span class="i-tabler:apps settings-card__icon" />
            <div>
              <div class="settings-card__title">
                应用
              </div>
              <div class="settings-card__subtitle">
                客户端、关于与赞助
              </div>
            </div>
          </div>
          <div class="settings-card__body">
            <div class="settings-card__actions">
              <Button variant="secondary" size="sm" @click="openInClient">
                <span class="i-mingcute:flash-line w-1em h-1em" />
                打开客户端
              </Button>
              <Button variant="secondary" size="sm" @click="ui.go('about')">
                <span class="i-tabler:info-circle w-1em h-1em" />
                关于 ENO-M
              </Button>
              <Button variant="secondary" size="sm" @click="openAfdian">
                <span class="i-tabler:heart w-1em h-1em" />
                赞助
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 32px 32px 48px;
}

.settings-inner {
  max-width: 900px;
}

.settings-hero {
  margin-bottom: 28px;
}

.settings-title {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.settings-desc {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.settings-card--wide {
  grid-column: 1 / -1;
}

@media (max-width: 800px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .settings-page {
    padding: 20px 16px 48px;
  }
}

.settings-card {
  overflow: hidden;
  border-radius: 8px;
  background: #181818;
}

.settings-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.settings-card__icon {
  font-size: 24px;
  color: #1ed760;
  flex-shrink: 0;
}

.settings-card__title {
  font-size: 16px;
  font-weight: 700;
}

.settings-card__subtitle {
  margin-top: 2px;
  font-size: 13px;
  color: #b3b3b3;
}

.settings-card__body {
  padding: 0 20px 20px;
}

.settings-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.settings-card__notes {
  font-size: 13px;
  color: #b3b3b3;
  line-height: 1.6;
}

.settings-card__notes ul {
  list-style: disc;
  padding-left: 20px;
  margin-top: 6px;
}

.xfade-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 999px;
  background: #282828;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.xfade-knob {
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: #535353;
  position: relative;
}

.xfade-knob::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.16s var(--eno-ease);
}

.xfade-toggle--on .xfade-knob {
  background: var(--eno-primary, #1ed760);
}

.xfade-toggle--on .xfade-knob::after {
  transform: translateX(16px);
}
</style>
