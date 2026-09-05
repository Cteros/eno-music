<script setup lang="ts">
import { Dialog } from '@cloudfly/eno-ui'
import { defaultSingers, useSingerStore } from '~/stores'
import SingerItem from '~/features/singer/SingerItem.vue'

function getMidFromUrl(url) {
  if (/^\d+$/.test(url))
    return url

  const match = url.match(/space\.bilibili\.com\/(\d+)/)
  if (match)
    return match[1]

  return ''
}

const PLstore = useSingerStore()
onMounted(() => {
  PLstore.fetchSingerInfoList()
})

const dialogVis = ref(false)
const singerMid = ref('')
function addSinger() {
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
  <section class="singer-list-page">
    <div class="page-head">
      <h1>关注歌手</h1>
      <button type="button" class="add-btn" @click.stop="dialogVis = true">
        <div class="i-mdi:user-add" />
        添加歌手
      </button>
    </div>
    <div class="artist-grid">
      <SingerItem v-for="serid in PLstore.singers" :key="serid" :singer-mid="serid" can-del />
    </div>
    <Dialog :open="dialogVis" title="添加自定义歌手" @visible-change="dialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="singerMid"
          placeholder="请输入歌手 mid 或 UP 主页链接"
          class="add-input"
        >
        <button class="add-submit" type="button" @click="addSinger">
          添加
        </button>
      </div>
    </Dialog>
  </section>
</template>

<style scoped>
.singer-list-page {
  height: 100%;
  overflow: auto;
  padding: 24px 32px 40px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  font-weight: 700;
  color: #000;
  background: #fff;
  cursor: pointer;
}

.artist-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.add-input {
  height: 40px;
  border: 0;
  border-radius: 4px;
  padding: 0 12px;
  color: #fff;
  background: #3e3e3e;
}

.add-submit {
  height: 40px;
  border: 0;
  border-radius: 999px;
  font-weight: 700;
  color: #000;
  background: #1ed760;
  cursor: pointer;
}
</style>
