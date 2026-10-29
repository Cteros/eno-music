<script setup lang="ts">
import type { AppView } from '~/stores'
import { useLocalStorage } from '@vueuse/core'
import cn from 'classnames'
import { useLibraryStore, useUiStore } from '~/stores'

const primaryTabs: { icon: string, title: string, mode: AppView }[] = [
  { icon: 'i-tabler:smart-home', title: '首页', mode: 'home' },
  { icon: 'i-tabler:search', title: '搜索', mode: 'search' },
  { icon: 'i-tabler:broadcast', title: '直播', mode: 'live' },
  { icon: 'i-tabler:news', title: '关注人更新', mode: 'followUpdates' },
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
        <div class="i-tabler:vinyl brand-icon" />
        <span v-if="open" class="brand-text">ENO-M</span>
        <span v-if="open" class="brand-seal eno-seal eno-seal--sm">印</span>
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
            <div class="i-tabler:folder" />
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
  width: 220px;
  height: calc(100% - 104px);
  flex-shrink: 0;
  flex-direction: column;
  gap: 18px;
  padding: 22px 12px 12px;
  border-right: 1px solid var(--eno-border);
}

.sider-shell--collapsed {
  width: 72px;
}

.sider-nav,
.sider-library {
  display: flex;
  flex-direction: column;
}

.sider-nav {
  gap: 2px;
}

.sider-library {
  min-height: 0;
  flex: 1;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  margin-bottom: 12px;
  padding: 0 10px;
  border: 0;
  color: var(--eno-text-1);
  background: transparent;
  cursor: pointer;
}

.brand-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  font-size: 22px;
  color: var(--eno-text-2);
}

.brand-text {
  font-family: var(--app-font-display);
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.brand-seal {
  margin-left: auto;
}

.nav-item,
.foot-item,
.library-toggle,
.lib-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 14px;
  height: 40px;
  padding: 0 10px;
  border: 0;
  border-left: 1px solid transparent;
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: transparent;
  font-family: var(--app-font-sans);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-align: left;
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease), border-color 0.16s var(--eno-ease);
}

.nav-item:hover,
.foot-item:hover,
.library-toggle:hover,
.lib-item:hover {
  color: var(--eno-text-1);
  background: var(--eno-fill-1);
}

.nav-item:active,
.foot-item:active,
.lib-item:active {
  background: var(--eno-fill-2);
}

.nav-item--active,
.foot-item--active,
.lib-item--active {
  border-left-color: var(--lp-seal-bright);
  color: var(--lp-paper);
  background: rgb(181 52 42 / 16%);
  font-weight: 600;
}

.nav-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  font-size: 22px;
}

.library-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding: 4px 0 10px;
  border-bottom: 1px solid var(--eno-border);
  margin-bottom: 8px;
}

.library-toggle {
  flex: 1;
  min-width: 0;
  height: 32px;
  color: var(--eno-text-3);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.library-add {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-3);
  background: transparent;
  cursor: pointer;
}

.sider-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.lib-item,
.lib-label {
  flex-shrink: 0;
}

.lib-item {
  height: 44px;
  font-size: 14px;
  font-weight: 500;
}

.lib-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  font-size: 20px;
}

.lib-text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.25;
}

.lib-text,
.lib-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lib-text small {
  margin-top: 2px;
  color: var(--eno-text-3);
  font-size: 12px;
  font-weight: 500;
}

.lib-label {
  padding: 16px 10px 6px;
  color: var(--eno-text-3);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.32em;
}

.lib-playlist {
  gap: 12px;
}

.lib-cover {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  object-fit: cover;
}

.lib-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--eno-text-3);
  background: var(--eno-fill-1);
}

.sider-foot {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 2px;
  padding-top: 10px;
  border-top: 1px solid var(--eno-border);
}

.foot-item {
  height: 36px;
  font-size: 13px;
  font-weight: 500;
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

.sider-shell--collapsed .brand-seal {
  display: none;
}
</style>
