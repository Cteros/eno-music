<script setup lang="ts">
import type { Component } from 'vue'
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
  <main
    class="
    bg-$eno-bg
    color-$eno-text-1 no-scroll relative" h-screen w-screen overflow="hidden" flex
  >
    <AddSong />
    <Sider />
    <div class="grow-1 shrink-10 h-screen fadeInWrapper app-surface">
      <component
        :is="page.component"
        v-for="page in pages"
        v-show="ui.mode === page.mode"
        :key="page.mode"
      />
    </div>
    <Play />
  </main>
</template>

<style>
.no-scroll {
  overflow: hidden;
  overscroll-behavior: none;  /* 防止滚动链接/弹性效果 */
  touch-action: none;         /* 防止移动端的触摸滚动 */
  -webkit-overflow-scrolling: auto;  /* 禁用 iOS 的弹性滚动 */
  position: fixed;            /* 可选：完全固定位置 */
  width: 100%;
  height: 100%;
}
html {
  background: var(--eno-bg);
}

*::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  *::-webkit-scrollbar-track {
    background: color-mix(in oklab, var(--eno-bg), black 10%);
    border-radius: 4px;
  }

  *::-webkit-scrollbar-thumb {
    cursor: pointer;
    background: var(--eno-fill-3);
    border-radius: 4px;
    border: 1px solid var(--eno-fill-2);

    &:hover {
      background: var(--eno-fill-4);
    }
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

.fadeInWrapper>* {
  animation: fadeIn 0.24s var(--eno-ease);
}

.fadeItem {
  animation: fadeIn 0.2s var(--eno-ease);
}

.app-surface {
  background: linear-gradient(180deg, color-mix(in oklab, var(--eno-bg), white 2%) 0%, var(--eno-bg) 100%);
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
