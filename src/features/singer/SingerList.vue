<script setup lang="ts">
import { Dialog } from '@cloudfly/eno-ui'
import { defaultSingers, useSingerStore } from '~/stores'
import SingerItem from '~/features/singer/SingerItem.vue'

// https://space.bilibili.com/17819768?spm_id_from=333.1007.tianma.1-1-1.click
function getMidFromUrl(url) {
  // 如果url 是纯数字, 则直接返回
  if (/^\d+$/.test(url)) {
    return url
  }
  const match = url.match(/space\.bilibili\.com\/(\d+)/)
  if (match) {
    return match[1]
  }
  return ''
}

const PLstore = useSingerStore()
onMounted(() => {
  PLstore.fetchSingerInfoList()
})

// 添加歌手相关
const dialogVis = ref(false)
const singerMid = ref('')
function addSinger() {
  // 判断是否已经存在, 判断singerMid是否合法
  const mid = getMidFromUrl(singerMid.value)
  if (!mid)
    return
  if (defaultSingers.includes(mid) || PLstore.singers.includes(mid))
    return

  PLstore.addSinger(mid)
  dialogVis.value = false
}
</script>

<template>
  <section class="h-screen overflow-auto pl-10">
    <div class="text-3xl mt-10 mb-5 flex gap-3">
      关注歌手
      <span
        class="text-sm text-gray-400/80 hover:text-gray-200 transition-all duration-100 flex items-end gap-1 cursor-pointer"
        @click.stop="dialogVis = true"
      >
        <div class="i-mdi:user-add w-24px h-24px" />
        添加歌手
      </span>
    </div>
    <div class="flex gap-5 flex-wrap mb-30 w-full">
      <SingerItem v-for="serid in PLstore.singers" :key="serid" :singer-mid="serid" can-del />
    </div>
    <Dialog :open="dialogVis" title="添加自定义歌手" @visible-change="dialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="singerMid" placeholder="请输入歌手mid或up主主页链接" bg="$eno-content focus:$eno-content-hover"
          class="h-10 px-3 border border-$eno-border rounded-3 text-$eno-text-1"
        >
        <button class="w-full h-10 bg-$eno-primary text-black rounded-3 hover:bg-$eno-primary-hover transition-colors" @click="addSinger">
          添加
        </button>
      </div>
    </Dialog>
  </section>
</template>
