<script setup lang="ts">
import type { Component } from 'vue'
import { storeToRefs } from 'pinia'
import Play from '~/features/player/Play.vue'
import Sider from '~/features/shell/Sider.vue'
import Playlist from '~/features/library/index.vue'
import AddSong from '~/features/library/AddSong.vue'
import About from '~/features/about/About.vue'
import Setting from '~/features/settings/Setting.vue'
import Home from '~/features/home/index.vue'
import Search from '~/features/search/Search.vue'
import ListenLater from '~/features/library/ListenLater.vue'
import SingerList from '~/features/singer/SingerList.vue'
import SingerDetail from '~/features/singer/SingerDetail.vue'
import { useUiStore } from '~/stores'
import { useBiliCookie } from '~/features/shell/useBiliCookie'

const ui = useUiStore()
const { mode } = storeToRefs(ui)
const { userInfo, syncCookieAndUser } = useBiliCookie()

const pages: { mode: string, component: Component }[] = [
  { mode: 'home', component: Home },
  { mode: 'search', component: Search },
  { mode: 'playlist', component: Playlist },
  { mode: 'listenLater', component: ListenLater },
  { mode: 'singerList', component: SingerList },
  { mode: 'singerDetail', component: SingerDetail },
  { mode: 'about', component: About },
  { mode: 'setting', component: Setting },
]

onMounted(() => {
  syncCookieAndUser()
})
provide('userInfo', userInfo)
</script>

<template>
  <main class="sp-app">
    <AddSong />
    <Sider />
    <div class="sp-main fadeInWrapper">
      <div
        v-for="page in pages"
        :key="page.mode"
        class="page-host"
        :class="{ 'page-host--hidden': mode !== page.mode }"
      >
        <component :is="page.component" />
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
  gap: 8px;
  padding: 8px 8px 0;
  background: #000;
  color: #fff;
  overscroll-behavior: none;
  touch-action: none;
}

html {
  background: #000;
}

.sp-main {
  position: relative;
  min-width: 0;
  flex: 1;
  height: calc(100% - 88px);
  overflow: hidden;
  border-radius: 8px;
  background: #121212;
}

.page-host {
  height: 100%;
}

.page-host--hidden {
  display: none;
}

.page-host > * {
  height: 100%;
}

*::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  cursor: pointer;
  border: 3px solid transparent;
  border-radius: 8px;
  background-clip: padding-box;
  background-color: rgb(255 255 255 / 30%);
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgb(255 255 255 / 50%);
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
