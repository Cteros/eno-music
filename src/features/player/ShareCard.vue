<script setup lang="ts">
import { Dialog, MessageAPI } from '@cloudfly/eno-ui'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import { ref } from 'vue'
import { useApiClient } from '~/api'
import { usePlayerStore } from '~/stores'

const store = usePlayerStore()
const api = useApiClient()
const dialogVis = ref(false)
const videoInfo = ref(null)
const qrCodeUrl = ref('')
const cardRef = ref(null)

// 格式化数字显示
function formatNumber(num) {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  return num.toString()
}

async function generateQRCode(url) {
  try {
    qrCodeUrl.value = await QRCode.toDataURL(url)
  }
  catch (err) {
    console.error('QR Code 生成失败:', err)
  }
}

async function getVideoInfo() {
  if (!store.play?.bvid)
    return

  const { data } = await api.blbl.getVideoInfo({
    bvid: store.play.id,
  })

  videoInfo.value = data
  // 生成视频链接的二维码
  await generateQRCode(`https://www.bilibili.com/video/${store.play.bvid}`)
}

async function showShareCard() {
  dialogVis.value = true
  await getVideoInfo()
}

async function captureCard() {
  try {
    // 先等待所有图片加载完成
    await new Promise((resolve) => {
      const images = cardRef.value.getElementsByTagName('img')
      let loadedImages = 0
      const totalImages = images.length

      if (totalImages === 0)
        resolve()

      Array.from(images).forEach((img) => {
        if (img.complete)
          loadedImages++
        else
          img.onload = () => ++loadedImages === totalImages && resolve()
      })

      if (loadedImages === totalImages)
        resolve()
    })

    const dataUrl = await toPng(cardRef.value, {
      quality: 1,
      backgroundColor: '#00000000',
      pixelRatio: 2,
      skipAutoScale: true,
      style: {
        borderRadius: '4px', // 与 CSS 中的圆角保持一致
        overflow: 'hidden',
      },
      filter: (node) => {
        return !node.classList?.contains('no-export')
      },
    })
    return dataUrl
  }
  catch {
    MessageAPI.show({
      type: 'error',
      message: '生成图片失败，请稍后重试',
    })
  }
}

async function saveAsImage() {
  try {
    const dataUrl = await captureCard()
    const link = document.createElement('a')
    link.download = `${videoInfo.value.title || 'share-card'}.png`
    link.href = dataUrl
    link.click()
    MessageAPI.show({
      type: 'success',
      message: '保存成功',
    })
  }
  catch {
    MessageAPI.show({
      type: 'error',
      message: '保存失败，请稍后重试',
    })
  }
}

async function copyToClipboard() {
  try {
    const dataUrl = await captureCard()
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
    MessageAPI.show({
      type: 'success',
      message: '已复制到剪贴板',
    })
  }
  catch {
    MessageAPI.show({
      type: 'error',
      message: '复制失败，请稍后重试',
    })
  }
}
</script>

<template>
  <span class="w-1rem h-1rem">
    <!-- 打开卡片的按钮 -->
    <div class="i-tabler:share w-1rem h-1rem cursor-pointer block" title="分享卡片" @click.stop="showShareCard" />
    <Dialog :open="dialogVis" title="分享卡片" @visible-change="dialogVis = $event">
      <div v-if="videoInfo" class="share-card-container">
        <!-- 分享卡片主体 -->
        <div ref="cardRef" class="share-card">
          <div class="share-cover">
            <!-- 视频封面 -->
            <img
              :src="videoInfo.pic"
              class="share-cover-img"
              alt="视频封面"
              crossorigin="anonymous"
            >
            <!-- 右下角二维码 -->
            <div class="qr-wrapper">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                class="share-qr-img"
                alt="视频二维码"
              >
              <div class="share-qr-cap">
                扫码观看视频
              </div>
            </div>
          </div>

          <!-- 视频信息 -->
          <div class="share-info">
            <h3 class="share-title">
              {{ videoInfo.title }}
            </h3>

            <div class="share-owner">
              <img
                :src="videoInfo.owner.face"
                class="share-avatar"
                crossorigin="anonymous"
              >
              <span class="share-owner-name">{{ videoInfo.owner.name }}</span>
            </div>

            <div class="share-stats">
              <span class="share-stat">
                <div class="i-tabler:player-play w-4 h-4" />
                {{ formatNumber(videoInfo.stat.view) }}
              </span>
              <span class="share-stat">
                <div class="i-tabler:thumb-up w-4 h-4" />
                {{ formatNumber(videoInfo.stat.like) }}
              </span>
              <span class="share-stat">
                <div class="i-tabler:message-circle w-4 h-4" />
                {{ formatNumber(videoInfo.stat.reply) }}
              </span>
              <!-- 由eno-m生成 -->
              <span class="share-stamp">
                <span class="share-seal eno-seal eno-seal--sm eno-seal--round eno-seal--paper">印</span>
                由 eno-m 生成
              </span>
            </div>

            <div class="share-desc">
              {{ videoInfo.desc }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="share-actions">
          <button
            type="button"
            class="share-btn share-btn--primary"
            @click="copyToClipboard"
          >
            <div class="i-tabler:copy w-4 h-4" />
            复制到剪贴板
          </button>
          <button
            type="button"
            class="share-btn"
            @click="saveAsImage"
          >
            <div class="i-tabler:download w-4 h-4" />
            保存图片
          </button>
        </div>
      </div>
    </Dialog>
  </span>
</template>

<style scoped>
.share-card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* —— 分享卡：纸页印张，导出即成品 —— */
.share-card {
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  border: 1px solid rgb(22 21 26 / 16%);
  border-radius: var(--eno-radius-lg);
  background: var(--lp-paper);
  box-shadow: var(--eno-shadow-md);
}

/* 确保内部图片不会溢出圆角 */
.share-card img {
  display: block;
  max-width: 100%;
}

.share-cover {
  position: relative;
  width: 100%;
}

.share-cover-img {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

.qr-wrapper {
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 8px;
  border-radius: var(--eno-radius-lg);
  background: #fff;
  box-shadow: var(--eno-shadow-sm);
}

.share-qr-img {
  width: 80px;
  height: 80px;
}

.share-qr-cap {
  margin-top: 4px;
  color: rgb(22 21 26 / 62%);
  font-family: var(--app-font-sans);
  font-size: 12px;
  text-align: center;
}

.share-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
}

.share-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--lp-ink);
  font-family: var(--app-font-display);
  font-size: 21px;
  font-weight: 900;
  letter-spacing: 0.03em;
  line-height: 1.4;
}

.share-owner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.share-avatar {
  width: 40px;
  height: 40px;
  border: 1px solid rgb(22 21 26 / 16%);
  border-radius: 50%;
  object-fit: cover;
}

.share-owner-name {
  color: var(--lp-ink);
  font-family: var(--app-font-sans);
  font-size: 13px;
  font-weight: 600;
}

.share-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: rgb(22 21 26 / 74%);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.share-stat,
.share-stamp {
  display: flex;
  align-items: center;
  gap: 6px;
}

.share-seal {
  flex-shrink: 0;
}

.share-desc {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: rgb(22 21 26 / 68%);
  font-family: var(--app-font-sans);
  font-size: 13px;
  line-height: 1.7;
}

.share-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.share-btn {
  display: inline-flex;
  height: 38px;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--eno-fill-2);
  color: var(--eno-text-1);
  font-family: var(--app-font-sans);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 0.16s var(--eno-ease), transform 0.16s var(--eno-ease), border-color 0.16s var(--eno-ease);
}

.share-btn:hover {
  background: var(--eno-fill-3);
  transform: translateY(-1px);
}

.share-btn:active {
  transform: translateY(1px);
}

.share-btn--primary {
  border-color: transparent;
  background: var(--lp-seal);
  color: var(--lp-paper);
}

.share-btn--primary:hover {
  background: var(--lp-seal-deep);
}

/* 确保图标在截图时正确显示 */
.share-card-container [class*='i-tabler'] {
  display: inline-block;
  vertical-align: middle;
}

@media (prefers-reduced-motion: reduce) {
  .share-btn {
    transition: none;
    transform: none;
  }
}
</style>
