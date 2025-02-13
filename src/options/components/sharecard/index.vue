<script setup>
import { ref } from 'vue'
import QRCode from 'qrcode'
import { toPng } from 'html-to-image'
import Dialog from '~/components/dialog/index.vue'
import { useBlblStore } from '~/options/blbl/store'
import { useApiClient } from '~/composables/api'
import Message from '~/components/message'

const store = useBlblStore()
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
        borderRadius: '0.75rem', // 与 CSS 中的圆角保持一致
        overflow: 'hidden',
      },
      filter: (node) => {
        return !node.classList?.contains('no-export')
      },
    })
    return dataUrl
  }
  catch (error) {
    Message.show({
      type: 'error',
      message: '生成图片失败，请稍后重试',
      error,
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
    Message.show({
      type: 'success',
      message: '保存成功',
    })
  }
  catch (err) {
    Message.show({
      type: 'error',
      message: '保存失败，请稍后重试',
      error: err,
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
    Message.show({
      type: 'success',
      message: '已复制到剪贴板',
    })
  }
  catch (err) {
    Message.show({
      type: 'error',
      message: '复制失败，请稍后重试',
      error: err,
    })
  }
}
</script>

<template>
  <span class="w-1rem h-1rem">
    <!-- 打开卡片的按钮 -->
    <div class="i-mingcute:card-pay-line w-1rem h-1rem cursor-pointer block" @click.stop="showShareCard" />
    <Dialog :open="dialogVis" title="分享卡片" height="auto" @visible-change="dialogVis = $event">
      <div v-if="videoInfo" class="share-card-container">
        <!-- 分享卡片主体 -->
        <div ref="cardRef" class="share-card">
          <div class="relative w-full">
            <!-- 视频封面 -->
            <img
              :src="videoInfo.pic"
              class="w-full h-[280px] object-cover"
              alt="视频封面"
              crossorigin="anonymous"
            >
            <!-- 右下角二维码 -->
            <div class="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg qr-wrapper">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                class="w-20 h-20"
                alt="视频二维码"
              >
              <div class="text-xs text-center mt-1 text-gray-600">
                扫码观看视频
              </div>
            </div>
          </div>

          <!-- 视频信息 -->
          <div class="p-6 space-y-4 bg-white">
            <h3 class="text-lg font-bold text-black line-clamp-2">
              {{ videoInfo.title }}
            </h3>

            <div class="flex items-center gap-3 text-gray-600">
              <img
                :src="videoInfo.owner.face"
                class="w-10 h-10 rounded-full"
                crossorigin="anonymous"
              >
              <span class="font-medium">{{ videoInfo.owner.name }}</span>
            </div>

            <div class="flex gap-6 text-sm text-gray-500">
              <span class="flex items-center gap-1.5">
                <div class="i-mingcute:play-fill w-4 h-4" />
                {{ formatNumber(videoInfo.stat.view) }}
              </span>
              <span class="flex items-center gap-1.5">
                <div class="i-mingcute:thumb-up-fill w-4 h-4" />
                {{ formatNumber(videoInfo.stat.like) }}
              </span>
              <span class="flex items-center gap-1.5">
                <div class="i-mingcute:comment-fill w-4 h-4" />
                {{ formatNumber(videoInfo.stat.reply) }}
              </span>
              <!-- 由eno-m生成 -->
              <span class="flex items-center gap-1.5">
                <div class="i-mingcute:share-forward-fill w-4 h-4" />
                由 eno-m 生成
              </span>
            </div>

            <div class="text-sm text-gray-600 line-clamp-3">
              {{ videoInfo.desc }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-center gap-4 mt-4">
          <button
            class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="copyToClipboard"
          >
            <div class="i-mingcute:copy-2-fill w-4 h-4" />
            复制到剪贴板
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            @click="saveAsImage"
          >
            <div class="i-mingcute:download-2-fill w-4 h-4" />
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
  padding: 1.5rem;
}

.share-card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 0.75rem; /* 12px */
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* 确保内部图片不会溢出圆角 */
.share-card img {
  display: block;
  max-width: 100%;
}

.qr-wrapper {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

button {
  font-size: 0.875rem;
  font-weight: 500;
}

button:active {
  transform: translateY(1px);
}

/* 确保图标在截图时正确显示 */
.share-card-container [class*='i-mingcute'] {
  display: inline-block;
  vertical-align: middle;
}
</style>
