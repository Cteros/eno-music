<script setup>
import { useLocalStorage } from '@vueuse/core'
import cn from 'classnames'
import Dialog from '../../components/dialog/index.vue'
import { usePlaylistStore } from '../playlist/store'
import TabItem from './TabItem.vue'

const tabs = [
  { icon: 'i-tabler:smart-home', title: '首页', mode: 'home' },
  { icon: 'i-tabler:music-search', title: '搜索', mode: 'search' },
  { icon: 'i-mingcute:version-line', title: '媒体库', mode: 'playlist' },
]

const PLStore = usePlaylistStore()

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
const open = useLocalStorage('sider-open', false)
const asideClass = computed(() => {
  return cn('w-16 h-full flex flex-col gap-1 flex-shrink-0 flex-grow-0 text-lg p-3 px-2 border-r border-r-$eno-fill-2 relative', {
    'w-60': open.value,
  })
})
const tabClass = computed(() => {
  return cn('tab-item flex w-full gap-3 text-2xl items-center h-10 cursor-pointer hover:bg-$eno-fill-2 rounded-2 pl-3', {
  })
})
function openAfdian() {
  window.open('https://afdian.com/a/meanc')
}
</script>

<template>
  <!-- 增加动画持续时间 -->
  <aside :class="asideClass" transition-all duration-300>
    <!-- logo and close -->
    <div
      class="flex items-center h-10 gap-3 tab-item cursor-pointer"
      @click="open = !open"
    >
      <div v-if="open" class="i-mingcute:indent-decrease-fill w-1em h-1em ml-3" />
      <div v-else class="i-mingcute:indent-increase-fill w-1em h-1em ml-3" />
      <span v-if="open" class="text-lg">ENO-M</span>
    </div>
    <!-- tab区 -->
    <TabItem v-for="tab in tabs" :key="tab.mode" :tab="tab" :open="open" />
    <!-- 分割线 -->
    <div class="h-0.5 bg-$eno-fill-2" />
    <div :class="`${tabClass}`" text-lg @click.stop="createDialogVis = true">
      <div class="i-tabler:playlist-add text-[20px]" />
      <span v-if="open" class="text-[14px]">新建播放列表</span>
    </div>
    <Dialog :open="createDialogVis" title="新建播放列表" @visible-change="createDialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="playlistName" type="text"
          class="border-none outline-none bg-$eno-content-hover h-10 px-3 autofocus rounded-4" placeholder="请输入播放列表名称"
        >
      </div>
      <template #footer>
        <div class="opt flex flex-row-reverse text-lg gap-3">
          <div class="bg-$eno-fill-2 px-6 py-1 rounded-10 cursor-pointer" @click.stop="createPlaylist">
            新建
          </div>
          <div class="hover:bg-$eno-fill-2 px-6 py-1 rounded-10 cursor-pointer" @click.stop="createDialogVis = false">
            取消
          </div>
        </div>
      </template>
    </Dialog>
    <TabItem :tab="{ icon: 'i-tabler:user-star', title: '关注的音乐人', mode: 'singerList' }" :open="open" />
    <TabItem class="h-13" :tab="{ icon: 'i-tabler:clock-play', mode: 'listenLater' }" :open="open">
      <template #default>
        <div v-if="open" text-xs>
          <div>稍后播放</div>
          <div>自动播放列表</div>
        </div>
      </template>
    </TabItem>
    <div class="absolute bottom-25 left-0 right-0 px-2">
      <!-- 在客户端中打开音乐播放器 -->
      <TabItem :tab="{ icon: 'i-mingcute:flash-line', title: '打开客户端', mode: 'openInClient' }" :open="open" />
      <!-- 关于 -->
      <TabItem :tab="{ icon: 'i-tabler:info-circle', title: '关于', mode: 'about' }" :open="open" />
      <!-- 设置 -->
      <TabItem :tab="{ icon: 'i-tabler:settings', title: '设置', mode: 'setting' }" :open="open" />
      <!-- 爱发电 -->
      <div :class="`${tabClass}`" text-lg @click.stop="openAfdian">
        <div class="i-mingcute:flash-line w-1em h-1em" />
        <span v-if="open" class="text-[14px]">探索</span>
      </div>
    </div>
  </aside>
</template>

<style>
.tab-item>*:nth-child(2) {
  /* display: none; */
  width: 0;
  overflow: hidden;
  text-wrap: nowrap;
  animation: widthAni 0.5s forwards;
}
@keyframes widthAni {
  from{
    width: 0;
    opacity: 0;
  }
  to{
    width: calc(100% - 5em);
    opacity: 1;
  }
}
</style>
