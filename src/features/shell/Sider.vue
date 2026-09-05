<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import cn from 'classnames'
import { useUiStore } from '~/stores'

const primaryTabs = [
  { icon: 'i-tabler:smart-home', title: '首页', mode: 'home' },
  { icon: 'i-tabler:search', title: '搜索', mode: 'search' },
]

const libraryTabs = [
  { icon: 'i-tabler:playlist', title: '媒体库', mode: 'playlist' },
  { icon: 'i-tabler:user-star', title: '关注的音乐人', mode: 'singerList' },
  { icon: 'i-tabler:clock-play', title: '稍后播放', mode: 'listenLater' },
]

const store = useUiStore()
const open = useLocalStorage('sider-open', true)
const asideClass = computed(() => {
  return cn('sider-shell', {
    'sider-shell--collapsed': !open.value,
  })
})

function openAfdian() {
  window.open('https://afdian.com/a/meanc')
}

async function openInClient() {
  const cookies = await chrome.cookies.getAll({ domain: '.bilibili.com' })
  const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
  const url = `eno-m://cookie?cookie=${encodeURIComponent(cookieString)}`
  window.open(url)
}

function switchMode(mode: string) {
  if (mode === 'openInClient') {
    openInClient()
    return
  }
  store.mode = mode
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
        :class="cn('nav-item', { 'nav-item--active': store.mode === tab.mode })"
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
      </div>

      <div class="sider-scroll">
        <button
          v-for="tab in libraryTabs"
          :key="tab.mode"
          type="button"
          :class="cn('lib-item', { 'lib-item--active': store.mode === tab.mode })"
          @click="switchMode(tab.mode)"
        >
          <div class="lib-icon" :class="tab.icon" />
          <span v-if="open" class="lib-text">{{ tab.title }}</span>
        </button>
      </div>

      <div class="sider-foot">
        <button
          type="button"
          class="foot-item"
          @click="switchMode('openInClient')"
        >
          <div class="i-mingcute:flash-line nav-icon" />
          <span v-if="open">打开客户端</span>
        </button>
        <button
          type="button"
          :class="cn('foot-item', { 'foot-item--active': store.mode === 'setting' })"
          @click="switchMode('setting')"
        >
          <div class="i-tabler:settings nav-icon" />
          <span v-if="open">设置</span>
        </button>
        <button
          type="button"
          :class="cn('foot-item', { 'foot-item--active': store.mode === 'about' })"
          @click="switchMode('about')"
        >
          <div class="i-tabler:info-circle nav-icon" />
          <span v-if="open">关于</span>
        </button>
        <button type="button" class="foot-item" @click.stop="openAfdian">
          <div class="i-tabler:external-link nav-icon" />
          <span v-if="open">探索</span>
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
  padding: 4px 0 8px;
}

.library-toggle {
  color: #b3b3b3;
  font-size: 16px;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
