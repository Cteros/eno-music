<script setup>
import { useLocalStorage } from '@vueuse/core'
import cn from 'classnames'
import Dialog from '../../components/dialog/index.vue'
import { useBlblStore } from '../blbl/store'
import { usePlaylistStore } from '../playlist/store'
import TabItem from './TabItem.vue'

const tabs = [
  { icon: 'i-tabler:smart-home', title: '首页', mode: 'home' },
  { icon: 'i-tabler:music-search', title: '搜索', mode: 'search' },
  { icon: 'i-mingcute:version-line', title: '媒体库', mode: 'playlist' },
]

const PLStore = usePlaylistStore()
const store = useBlblStore()

// 新建歌单相关代码
const createDialogVis = ref(false)
const playlistName = ref('')
function createPlaylist() {
  const list = PLStore.list
  // 重名校验, 空校验
  if (list.some(pl => pl.name === playlistName.value) || !playlistName.value)
    return

  PLStore.createPlaylist(playlistName.value)
  createDialogVis.value = false
}
// 侧边栏展开相关代码
const open = useLocalStorage('sider-open', true)
const asideClass = computed(() => {
  return cn('sider-shell', {
    'w-16': !open.value,
    'w-[19.5rem]': open.value,
  })
})
const tabClass = computed(() => {
  return cn('sider-row', {
  })
})
function openAfdian() {
  window.open('https://afdian.com/a/meanc')
}
function goSearch() {
  store.mode = 'search'
}
</script>

<template>
  <aside :class="asideClass" transition-all duration-220 ease-out>
    <div class="sider-top">
      <div class="brand-row" @click="open = !open">
        <div class="i-mingcute:disc-fill h-1.05em w-1.05em text-$eno-text-1" />
        <span v-if="open" class="brand-text">ENO-M</span>
        <div v-if="open" class="i-mingcute:down-line ml-auto h-1em w-1em text-$eno-text-4" />
      </div>
      <div v-if="open" class="top-actions">
        <button class="top-icon" title="搜索" @click.stop="goSearch">
          <div class="i-tabler:search h-1em w-1em" />
        </button>
        <button class="top-icon" title="探索" @click.stop="openAfdian">
          <div class="i-tabler:external-link h-1em w-1em" />
        </button>
      </div>
    </div>

    <div class="sider-scroll">
      <p v-if="open" class="sider-label">
        Workspace
      </p>
      <TabItem v-for="tab in tabs" :key="tab.mode" :tab="tab" :open="open" />
      <div :class="`${tabClass}`" @click.stop="createDialogVis = true">
        <div class="i-tabler:playlist-add sider-row-icon" />
        <span v-if="open" class="sider-row-text">新建播放列表</span>
      </div>

      <p v-if="open" class="sider-label mt-5">
        Library
      </p>
      <TabItem :tab="{ icon: 'i-tabler:user-star', title: '关注的音乐人', mode: 'singerList' }" :open="open" />
      <TabItem :tab="{ icon: 'i-tabler:clock-play', title: '稍后播放', mode: 'listenLater' }" :open="open" />

      <p v-if="open" class="sider-label mt-5">
        System
      </p>
      <TabItem :tab="{ icon: 'i-mingcute:flash-line', title: '打开客户端', mode: 'openInClient' }" :open="open" />
      <TabItem :tab="{ icon: 'i-tabler:settings', title: '设置', mode: 'setting' }" :open="open" />
      <TabItem :tab="{ icon: 'i-tabler:info-circle', title: '关于', mode: 'about' }" :open="open" />
      <div :class="`${tabClass}`" @click.stop="openAfdian">
        <div class="i-mingcute:flash-line sider-row-icon" />
        <span v-if="open" class="sider-row-text">探索</span>
      </div>
    </div>

    <Dialog :open="createDialogVis" title="新建播放列表" @visible-change="createDialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="playlistName" type="text"
          class="border-none outline-none bg-$eno-content-hover h-10 px-3 autofocus rounded-3 text-$eno-text-1" placeholder="请输入播放列表名称"
        >
      </div>
      <template #footer>
        <div class="opt flex flex-row-reverse text-sm gap-3">
          <div class="bg-$eno-primary text-black px-4 py-1 rounded-3 cursor-pointer hover:bg-$eno-primary-hover" @click.stop="createPlaylist">
            新建
          </div>
          <div class="hover:bg-$eno-fill-2 px-4 py-1 rounded-3 cursor-pointer" @click.stop="createDialogVis = false">
            取消
          </div>
        </div>
      </template>
    </Dialog>
  </aside>
</template>

<style scoped>
.sider-shell {
  position: relative;
  display: flex;
  height: calc(100% - 16px);
  margin: 8px 8px 8px 9px;
  flex-direction: column;
  flex-shrink: 0;
  gap: 0.4rem;
  padding: 0.78rem 0.58rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 10%);
  border-radius: 20px;
  background:
    radial-gradient(130% 120% at -30% -10%, rgb(255 255 255 / 7%), transparent 46%),
    linear-gradient(180deg, rgb(255 255 255 / 4%), rgb(255 255 255 / 1%));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 7%),
    0 14px 28px rgb(0 0 0 / 22%);
}

.sider-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
}

.brand-row {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.68rem;
  border-radius: 11px;
  padding: 0.48rem 0.62rem;
  cursor: pointer;
  color: var(--eno-text-2);
}

.brand-row:hover {
  background: rgb(255 255 255 / 4%);
}

.brand-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.12rem;
  font-weight: 640;
  letter-spacing: -0.01em;
  color: var(--eno-text-1);
}

.top-actions {
  display: flex;
  gap: 0.46rem;
}

.top-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid color-mix(in oklab, var(--eno-border), white 6%);
  border-radius: 11px;
  color: var(--eno-text-2);
  background: rgb(255 255 255 / 2%);
  cursor: pointer;
  transition: color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease), border-color 0.16s var(--eno-ease);
}

.top-icon:hover {
  color: var(--eno-text-1);
  border-color: color-mix(in oklab, var(--eno-border), white 20%);
  background: rgb(255 255 255 / 5%);
}

.sider-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.18rem;
  overflow: auto;
  padding: 0.22rem 0.12rem 0.56rem;
}

.sider-label {
  margin: 0.58rem 0.52rem 0.22rem;
  font-size: 0.86rem;
  font-weight: 610;
  letter-spacing: -0.01em;
  color: var(--eno-text-4);
}

.sider-row {
  display: flex;
  align-items: center;
  gap: 0.68rem;
  height: 2.62rem;
  padding: 0 0.74rem;
  border-radius: 11px;
  color: var(--eno-text-2);
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), color 0.16s var(--eno-ease);
}

.sider-row:hover {
  background: rgb(255 255 255 / 4%);
  color: var(--eno-text-1);
}

.sider-row-icon {
  width: 1.08rem;
  height: 1.08rem;
  font-size: 1.08rem;
}

.sider-row-text {
  font-size: 0.98rem;
  font-weight: 530;
  letter-spacing: -0.01em;
  text-wrap: nowrap;
}

@media (max-width: 900px) {
  .sider-shell {
    margin: 7px 7px 7px 8px;
    border-radius: 14px;
  }
}
</style>
