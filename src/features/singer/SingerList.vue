<script setup lang="ts">
import { Dialog, MessageAPI } from '@cloudfly/eno-ui'
import { getFollowings } from '~/api'
import SingerItem from '~/features/singer/SingerItem.vue'
import { zhError } from '~/shared/zhError'
import { defaultSingers, useSingerStore } from '~/stores'

function getMidFromUrl(url) {
  if (/^\d+$/.test(url))
    return url

  const match = url.match(/space\.bilibili\.com\/(\d+)/)
  if (match)
    return match[1]

  return ''
}

const PLstore = useSingerStore()
const userInfo = inject('userInfo', ref<Record<string, any>>({}))
const importing = ref(false)

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

async function importFollowings() {
  const mid = Number((userInfo.value as any)?.mid)
  if (!mid) {
    MessageAPI.show({ type: 'warning', message: '请先登录 B 站' })
    return
  }
  importing.value = true
  try {
    const res = await getFollowings({ mid, ps: 50 })
    const list = res?.data?.list || []
    let added = 0
    for (const item of list) {
      const followMid = String(item.mid)
      if (!followMid || PLstore.singers.includes(followMid))
        continue
      PLstore.addSinger(followMid)
      added++
    }
    MessageAPI.show({
      type: 'success',
      message: added ? `已导入 ${added} 位关注` : '没有新的关注可导入',
    })
  }
  catch (error) {
    MessageAPI.show({
      type: 'error',
      message: zhError(error, '导入关注失败'),
    })
  }
  finally {
    importing.value = false
  }
}
</script>

<template>
  <section class="singer-list-page">
    <div class="page-head">
      <h1 class="page-title">
        关注的音乐人
      </h1>
      <div class="head-ops">
        <button type="button" class="btn" :disabled="importing" @click.stop="importFollowings">
          {{ importing ? '导入中…' : '导入 B 站关注' }}
        </button>
        <button type="button" class="btn-primary" @click.stop="dialogVis = true">
          <div class="i-tabler:user-plus" />
          添加歌手
        </button>
      </div>
    </div>
    <div v-if="PLstore.singers.length" class="singer-list">
      <SingerItem v-for="serid in PLstore.singers" :key="serid" :singer-mid="serid" can-del />
    </div>
    <div v-else class="eno-empty">
      <div class="eno-empty__icon">
        <div class="i-tabler:user-star" />
      </div>
      <div class="eno-empty__title">
        还没有音乐人
      </div>
      <div class="eno-empty__hint">
        点「添加歌手」，或「导入 B 站关注」
      </div>
    </div>
    <Dialog :open="dialogVis" title="添加自定义歌手" @visible-change="dialogVis = $event">
      <div class="flex flex-col gap-3 w-full h-full justify-between">
        <input
          v-model="singerMid"
          placeholder="请输入歌手 mid 或 UP 主页链接"
          class="eno-input add-input"
        >
        <button class="btn-primary add-submit" type="button" @click="addSinger">
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-family: var(--app-font-display);
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.head-ops {
  display: flex;
  gap: 10px;
}

.singer-list {
  display: flex;
  flex-direction: column;
}

.add-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
}

.add-submit {
  width: 100%;
}

@media (max-width: 860px) {
  .singer-list-page {
    padding: 20px 16px 32px;
  }
}
</style>
