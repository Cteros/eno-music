<!-- eslint-disable no-console -->
<script setup>
// 第三方库
import { useLocalStorage } from '@vueuse/core'

// 组件
import Play from './components/Play/Play.vue'
import Sider from './components/Sider.vue'
import WallpaperGen from './components/wallpaper-gen/index.vue'

// 播放列表相关
import Playlist from './playlist/index.vue'
import AddSong from './playlist/AddSong.vue'

// 页面
import About from './pages/About.vue'
import Setting from './pages/Setting.vue'
import Home from './pages/Home/index.vue'
import Search from './pages/Search.vue'
import ListenLater from './pages/ListenLater.vue'
import SingerList from './pages/Singer/SingerList.vue'
import SingerDetail from './pages/Singer/SingerDetail.vue'

// API 和 Store
import { useBlblStore } from './blbl/store.ts'
import { usePlaylistStore } from './playlist/store'
import { getUserInfo } from './api'

const store = useBlblStore()
const PLstore = usePlaylistStore()
const CST = useLocalStorage('cookieSetTime', 0)
const userInfo = ref({})

function getCookie() {
  // 这部分暂时不删除, 调试太麻烦
  const domain = 'https://api.bilibili.com'
  fetch(domain, {
    method: 'GET',
    mode: 'no-cors',
    credentials: 'include',
  }).then((res) => {
    // get cookie from response
    const cookie = res.headers.get('set-cookie')

    chrome.cookies?.set({
      ...cookie,
    })
  })
}

function getBLCookie() {
  chrome.cookies.getAll({ domain: '.bilibili.com' }, (cookies) => {
    if (cookies.length > 0) {
      cookies.forEach((cookie) => {
        chrome.cookies.set({
          url: 'https://www.bilibili.com', // 使用适当的 URL
          name: cookie.name,
          value: cookie.value,
          path: cookie.path, // 根据需要添加其他属性
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expirationDate: cookie.expirationDate, // 如果需要过期时间
        }, () => {
          if (chrome.runtime.lastError) {
            console.error(`Error setting cookie ${cookie.name}: ${chrome.runtime.lastError}`)
          }
          else {
            console.log(`Cookie ${cookie.name} set`)
          }
        })
      })
    }
    else {
      console.log('No Bilibili cookies found')
    }
  })
}

onMounted(() => {
  getBLCookie()
  PLstore.initUserPermission()
  // 每天获取一次cookie就可以
  if (Date.now() - CST.value > 24 * 60 * 60 * 1000) {
    CST.value = Date.now()
    getCookie()
  }
  getUserInfo().then((res) => {
    userInfo.value = res.data
  })
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
      <Home v-show="store.mode === 'home'" />
      <Search v-show="store.mode === 'search'" />
      <Playlist v-show="store.mode === 'playlist'" />
      <ListenLater v-show="store.mode === 'listenLater'" />
      <SingerList v-show="store.mode === 'singerList'" />
      <SingerDetail v-show="store.mode === 'singerDetail'" />
      <About v-show="store.mode === 'about'" />
      <Setting v-show="store.mode === 'setting'" />
    </div>
    <Play />
    <WallpaperGen />
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
