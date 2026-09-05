<script setup lang="ts">
import { Button, MessageAPI } from '@cloudfly/eno-ui'
import Eq from '~/features/player/Eq.vue'
import { useLibraryStore, useSingerStore } from '~/stores'

const playlistStore = useLibraryStore()
const singerStore = useSingerStore()

function exportData() {
  const data = { singers: singerStore.singers, list: playlistStore.list }
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'blbl_data.json'
  a.click()
}

async function importData() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON文件',
        accept: { 'application/json': ['.json'] },
      }],
    })
    const fileData = await fileHandle.getFile()
    const json = await fileData.text()
    const data = JSON.parse(json)

    if (!data.singers || !data.list) {
      MessageAPI.show({ type: 'warning', message: '数据格式不正确' })
      return
    }
    singerStore.singers = data.singers
    playlistStore.list = data.list
    MessageAPI.show({ type: 'success', message: '导入成功' })
  }
  catch (error) {
    console.error(error)
    MessageAPI.show({ type: 'error', message: '导入失败' })
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-inner">
      <!-- Hero -->
      <div class="settings-hero">
        <div>
          <h1 class="settings-title">
            设置
          </h1>
          <p class="settings-desc">
            管理你的数据与均衡器偏好
          </p>
        </div>
      </div>

      <!-- Grid -->
      <div class="settings-grid">
        <!-- Data Card -->
        <div class="settings-card">
          <div class="settings-card__header">
            <span class="i-tabler:database-heart settings-card__icon" />
            <div>
              <div class="settings-card__title">
                数据管理
              </div>
              <div class="settings-card__subtitle">
                导入或导出你的歌手列表和播放列表数据
              </div>
            </div>
          </div>
          <div class="settings-card__body">
            <div class="settings-card__actions">
              <Button variant="secondary" size="sm" @click="exportData">
                <span class="i-tabler:download w-1em h-1em" />
                导出数据
              </Button>
              <Button variant="secondary" size="sm" @click="importData">
                <span class="i-tabler:upload w-1em h-1em" />
                导入数据
              </Button>
            </div>
            <div class="settings-card__notes">
              <p>当前导出的数据包含：</p>
              <ul>
                <li>歌手列表数据</li>
                <li>播放列表数据</li>
              </ul>
              <p class="mt-2 text-$eno-text-3">
                导入会覆盖当前的数据，请谨慎操作。
              </p>
            </div>
          </div>
        </div>

        <!-- EQ Card -->
        <div class="settings-card">
          <div class="settings-card__header">
            <span class="i-tabler:adjustments-horizontal settings-card__icon" />
            <div>
              <div class="settings-card__title">
                均衡器
              </div>
              <div class="settings-card__subtitle">
                调节音频频率响应
              </div>
            </div>
          </div>
          <div class="settings-card__body">
            <Eq />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 32px 32px 48px;
}

.settings-inner {
  max-width: 900px;
}

.settings-hero {
  margin-bottom: 28px;
}

.settings-title {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.settings-desc {
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 800px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .settings-page {
    padding: 20px 16px 48px;
  }
}

.settings-card {
  overflow: hidden;
  border-radius: 8px;
  background: #181818;
}

.settings-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.settings-card__icon {
  font-size: 24px;
  color: #1ed760;
  flex-shrink: 0;
}

.settings-card__title {
  font-size: 16px;
  font-weight: 700;
}

.settings-card__subtitle {
  margin-top: 2px;
  font-size: 13px;
  color: #b3b3b3;
}

.settings-card__body {
  padding: 0 20px 20px;
}

.settings-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.settings-card__notes {
  font-size: 13px;
  color: #b3b3b3;
  line-height: 1.6;
}

.settings-card__notes ul {
  list-style: disc;
  padding-left: 20px;
  margin-top: 6px;
}
</style>
