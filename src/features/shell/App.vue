<script setup lang="ts">
import type { Component } from 'vue'
import type { AppView } from '~/stores'
import { storeToRefs } from 'pinia'
import About from '~/features/about/About.vue'
import FollowUpdates from '~/features/follow/FollowUpdates.vue'
import Home from '~/features/home/index.vue'
import AddSong from '~/features/library/AddSong.vue'
import Playlist from '~/features/library/index.vue'
import ListenLater from '~/features/library/ListenLater.vue'
import Recent from '~/features/library/Recent.vue'
import Live from '~/features/live/Live.vue'
import CoverStage from '~/features/player/CoverStage.vue'
import Play from '~/features/player/Play.vue'
import { useCoverVisual } from '~/features/player/useCoverVisual'
import { useVizMotion } from '~/features/player/useVizMotion'
import Search from '~/features/search/Search.vue'
import Setting from '~/features/settings/Setting.vue'
import Sider from '~/features/shell/Sider.vue'
import { useBiliCookie } from '~/features/shell/useBiliCookie'
import SingerDetail from '~/features/singer/SingerDetail.vue'
import SingerList from '~/features/singer/SingerList.vue'
import { chromeStorageLocal, offChromeStorageChanged, onChromeStorageChanged } from '~/shared/chromeApi'
import { PLAYER_STATE_KEY } from '~/shared/playerBridge'
import { usePlayerStore, useUiStore } from '~/stores'

const ui = useUiStore()
const player = usePlayerStore()
const { mode } = storeToRefs(ui)
const { userInfo, ready, syncCookieAndUser } = useBiliCookie()
const playing = ref(false)
const { root, coverSrc } = useCoverVisual(() => player.play?.cover)
useVizMotion()

function readPlaying(value?: { isPlaying?: boolean }) {
  playing.value = Boolean(value?.isPlaying)
}

const pages: { mode: AppView, component: Component }[] = [
  { mode: 'home', component: Home },
  { mode: 'search', component: Search },
  { mode: 'playlist', component: Playlist },
  { mode: 'listenLater', component: ListenLater },
  { mode: 'recent', component: Recent },
  { mode: 'singerList', component: SingerList },
  { mode: 'singerDetail', component: SingerDetail },
  { mode: 'live', component: Live },
  { mode: 'followUpdates', component: FollowUpdates },
  { mode: 'about', component: About },
  { mode: 'setting', component: Setting },
]

function onPlayingStorage(
  changes: Record<string, { newValue?: unknown }>,
  area: string,
) {
  if (area !== 'local' || !changes[PLAYER_STATE_KEY])
    return
  readPlaying(changes[PLAYER_STATE_KEY].newValue as { isPlaying?: boolean } | undefined)
}

onMounted(() => {
  syncCookieAndUser()
  const splash = document.getElementById('eno-splash')
  if (splash) {
    window.setTimeout(() => splash.remove(), Math.max(0, 2100 - performance.now()))
  }
  void chromeStorageLocal().get(PLAYER_STATE_KEY).then((data) => {
    readPlaying(data[PLAYER_STATE_KEY] as { isPlaying?: boolean } | undefined)
  }).catch(() => {})
  onChromeStorageChanged(onPlayingStorage)
})
onUnmounted(() => {
  offChromeStorageChanged(onPlayingStorage)
})
provide('userInfo', userInfo)
const isLoggedIn = computed(() => Boolean((userInfo.value as any)?.mid || (userInfo.value as any)?.isLogin))
</script>

<template>
  <main ref="root" class="sp-app">
    <AddSong />
    <Sider />
    <div class="sp-main fadeInWrapper">
      <CoverStage :src="coverSrc" :playing="playing" />
      <div v-if="ready && !isLoggedIn" class="login-banner">
        <span>未登录 B 站，收藏夹和部分音轨可能不可用。</span>
        <a href="https://www.bilibili.com" target="_blank" rel="noreferrer">去登录</a>
      </div>
      <div class="sp-pages">
        <div class="sp-chrome">
          <button
            class="sp-back"
            type="button"
            :disabled="!ui.canBack"
            :title="ui.canBack ? '返回' : '没有上一页'"
            @click="ui.back()"
          >
            <div class="i-tabler:arrow-left" />
          </button>
          <span class="sp-chrome-title">{{ ui.pageTitle }}</span>
        </div>
        <div class="sp-stage">
          <div
            v-for="page in pages"
            :key="page.mode"
            class="page-host"
            :class="{ 'page-host--hidden': mode !== page.mode }"
          >
            <component :is="page.component" />
          </div>
        </div>
      </div>
    </div>
    <Play />
  </main>
</template>

<style>
.sp-app {
  position: fixed;
  inset: 0;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--lp-ink-deep);
  color: var(--eno-text-1);
  overscroll-behavior: none;
  touch-action: none;
}

html {
  background: var(--lp-ink-deep);
}

.sp-main {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  height: calc(100% - 104px);
  overflow: hidden;
  background: var(--lp-ink);
}

.sp-pages {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.sp-chrome {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid var(--eno-border);
  background: transparent;
}

.sp-back {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  color: var(--eno-text-2);
  background: transparent;
  cursor: pointer;
}

.sp-back:hover:not(:disabled) {
  color: var(--eno-text-1);
  background: var(--eno-fill-2);
}

.sp-back:disabled {
  cursor: default;
  opacity: 0.35;
}

.sp-chrome-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--app-font-display);
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.sp-stage {
  position: relative;
  min-height: 0;
  flex: 1;
}

.login-banner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 24px;
  border-bottom: 1px solid var(--eno-border);
  background: var(--eno-fill-1);
  color: var(--eno-text-3);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.login-banner a {
  color: var(--lp-indigo-light);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
}

.login-banner a:hover {
  color: var(--lp-paper);
}

.page-host {
  height: 100%;
  transition: opacity 0.18s var(--eno-ease), transform 0.18s var(--eno-ease);
}

.page-host--hidden {
  display: none;
}

/* 每次从 display:none 恢复时播放轻量入场 */
@starting-style {
  .page-host {
    opacity: 0;
    transform: translateY(8px);
  }
}

.page-host > * {
  height: 100%;
}

img {
  position: relative;

  &::before {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    background-image: url("/assets/broken-image.png");
    background-size: 25px;
    background-position: center;
    background-repeat: no-repeat;
  }
}

.fadeInWrapper > * {
  animation: fadeIn 0.22s var(--eno-ease);
}

.fadeItem {
  animation: fadeIn 0.2s var(--eno-ease);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
