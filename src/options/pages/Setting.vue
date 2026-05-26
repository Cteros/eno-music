<script setup>
import { Button, MessageAPI } from '@cloudfly/eno-ui'
import Eq from '../components/Eq/Eq.vue'
import { usePlaylistStore } from '~/options/playlist/store'

const playlistStore = usePlaylistStore()

function exportData() {
  const { singers, list } = playlistStore
  const data = { singers, list }
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
    playlistStore.singers = data.singers
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
  height: 100vh;
  overflow-y: auto;
  padding: 40px 48px 120px;
}

.settings-inner {
  max-width: 900px;
  margin: 0 auto;
}

.settings-hero {
  margin-bottom: 28px;
}

.settings-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--eno-text-1, #e0e0e0);
  margin-bottom: 4px;
}

.settings-desc {
  font-size: 14px;
  color: var(--eno-text-3, #888);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 800px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .settings-page {
    padding: 24px 20px 120px;
  }
}

.settings-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.settings-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-card__icon {
  font-size: 24px;
  color: var(--eno-text-2, #aaa);
  flex-shrink: 0;
}

.settings-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--eno-text-1, #e0e0e0);
}

.settings-card__subtitle {
  font-size: 12px;
  color: var(--eno-text-3, #888);
  margin-top: 1px;
}

.settings-card__body {
  padding: 16px 20px;
}

.settings-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.settings-card__notes {
  font-size: 13px;
  color: var(--eno-text-2, #aaa);
  line-height: 1.6;
}

.settings-card__notes ul {
  list-style: disc;
  padding-left: 20px;
  margin-top: 6px;
}

.settings-card__notes li {
  margin-bottom: 2px;
}
</style>
