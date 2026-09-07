<script setup lang="ts">
import type { AppView } from '~/stores'
import { useLocalStorage } from '@vueuse/core'
import cn from 'classnames'
import { useLibraryStore, useUiStore } from '~/stores'

const primaryTabs: { icon: string, title: string, mode: AppView }[] = [
  { icon: 'i-tabler:smart-home', title: '首页', mode: 'home' },
  { icon: 'i-tabler:search', title: '搜索', mode: 'search' },
]

const libraryPins: { icon: string, title: string, mode: AppView }[] = [
  { icon: 'i-tabler:playlist', title: '媒体库', mode: 'playlist' },
  { icon: 'i-tabler:clock-play', title: '稍后播放', mode: 'listenLater' },
  { icon: 'i-tabler:history', title: '最近播放', mode: 'recent' },
  { icon: 'i-tabler:user-star', title: '关注的音乐人', mode: 'singerList' },
]

const ui = useUiStore()
const library = useLibraryStore()
const open = useLocalStorage('sider-open', true)
const asideClass = computed(() => {
  return cn('sider-shell', {
    'sider-shell--collapsed': !open.value,
  })
})

function playlistCover(playlist: { cover?: string, songs?: { cover?: string }[] }) {
  return playlist.cover || playlist.songs?.find(song => song?.cover)?.cover || ''
}

function isPinActive(mode: AppView) {
  if (mode === 'playlist')
    return ui.mode === 'playlist' && ui.playlistId == null
  if (mode === 'singerList')
    return ui.mode === 'singerList' || ui.mode === 'singerDetail'
  return ui.mode === mode
}

function isPlaylistActive(id: string | number) {
  return ui.mode === 'playlist' && String(ui.playlistId) === String(id)
}

function switchMode(mode: AppView) {
  ui.go(mode)
}

async function startCreate() {
  ui.go('playlist')
  await nextTick()
  library.promptCreate = true
}
</script>

<template>
  <aside :class="asideClass">
    <div class="sider-nav">
      <button class="brand-row" type="button" @click="open = !open">
        <div class="i-mingcute:disc-fill brand-icon" />
        <span v-if="open" class="brand-text">ENO-M</span>
      </button>
      <button
        v-for="tab in primaryTabs"
        :key="tab.mode"
        type="button"
        :class="cn('nav-item', { 'nav-item--active': ui.mode === tab.mode })"
        @click="switchMode(tab.mode)"
      >
        <div class="nav-icon" :class="tab.icon" />
        <span v-if="open">{{ tab.title }}</span>
      </button>
    </div>

    <div class="sider-library">
      <div class="library-head">
        <button class="library-toggle" type="button" @click="open = !open">
          <div class="i-tabler:books nav-icon" />
          <span v-if="open">你的音乐库</span>
        </button>
        <button
          v-if="open"
          class="library-add"
          type="button"
          title="新建歌单"
          @click="startCreate"
        >
          <div class="i-tabler:plus" />
        </button>
      </div>

      <div class="sider-scroll">
        <button
          v-for="tab in libraryPins"
          :key="tab.mode"
          type="button"
          :class="cn('lib-item', { 'lib-item--active': isPinActive(tab.mode) })"
          :title="tab.title"
          @click="switchMode(tab.mode)"
        >
          <div class="lib-icon" :class="tab.icon" />
          <span v-if="open" class="lib-text">{{ tab.title }}</span>
        </button>

        <div v-if="open && library.list.length" class="lib-label">
          歌单
        </div>

        <button
          v-for="playlist in library.list"
          :key="playlist.id"
          type="button"
          :class="cn('lib-item lib-playlist', { 'lib-item--active': isPlaylistActive(playlist.id) })"
          :title="playlist.name"
          @click="ui.openPlaylist(playlist.id)"
        >
          <img
            v-if="playlistCover(playlist)"
            class="lib-cover"
            :src="playlistCover(playlist)"
            alt=""
          >
          <div v-else class="lib-cover lib-cover--empty">
            <div class="i-mingcute:folder-fill" />
          </div>
          <span v-if="open" class="lib-text">
            {{ playlist.name }}
            <small>{{ playlist.songs.length }} 首</small>
          </span>
        </button>
      </div>

      <div class="sider-foot">
        <button
          type="button"
          :class="cn('foot-item', { 'foot-item--active': ui.mode === 'setting' || ui.mode === 'about' })"
          @click="switchMode('setting')"
        >
          <div class="i-tabler:settings nav-icon" />
          <span v-if="open">设置</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sider-shell {
  display: flex;
  width: 280px;
  height: calc(100% - 88px);
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
}

.sider-shell--collapsed {
  width: 72px;
}

.sider-nav,
.sider-library {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #121212;
}

.sider-nav {
  padding: 8px 12px 12px;
  gap: 4px;
}

.sider-library {
  min-height: 0;
  flex: 1;
  padding: 8px 8px 12px;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  background: transparent;
  cursor: pointer;
}

.brand-icon {
  width: 24px;
  height: 24px;
  font-size: 24px;
}

.brand-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.nav-item,
.foot-item,
.library-toggle,
.lib-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  color: #b3b3b3;
  background: transparent;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

.nav-item:hover,
.foot-item:hover,
.library-toggle:hover,
.lib-item:hover {
  color: #fff;
}

.nav-item--active,
.foot-item--active,
.lib-item--active {
  color: #fff;
}

.nav-icon {
  width: 24px;
  height: 24px;
  font-size: 24px;
  flex-shrink: 0;
}

.library-head {
  display: flex;
  align-items: center;
  padding: 4px 0 8px;
}

.library-toggle {
  flex: 1;
  min-width: 0;
  color: #b3b3b3;
  font-size: 16px;
}

.library-add {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: #b3b3b3;
  background: transparent;
  cursor: pointer;
}

.library-add:hover {
  color: #fff;
  background: #1a1a1a;
}

.sider-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  overflow: auto;
}

.lib-item {
  height: 48px;
  font-size: 14px;
  font-weight: 600;
}

.lib-item--active {
  background: #1a1a1a;
}

.lib-icon {
  width: 24px;
  height: 24px;
  font-size: 20px;
  flex-shrink: 0;
}

.lib-text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.2;
}

.lib-text,
.lib-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lib-text small {
  margin-top: 2px;
  color: #7a7a7a;
  font-size: 12px;
  font-weight: 500;
}

.lib-label {
  padding: 12px 12px 6px;
  color: #7a7a7a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.lib-playlist {
  gap: 12px;
}

.lib-cover {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: cover;
}

.lib-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b3b3b3;
  background: #2a2a2a;
}

.sider-foot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 8px;
}

.foot-item {
  height: 36px;
  font-size: 13px;
  font-weight: 600;
}

.sider-shell--collapsed .nav-item,
.sider-shell--collapsed .lib-item,
.sider-shell--collapsed .foot-item,
.sider-shell--collapsed .library-toggle,
.sider-shell--collapsed .brand-row {
  justify-content: center;
  padding: 0;
  gap: 0;
}
</style>
