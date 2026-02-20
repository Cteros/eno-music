<script setup lang="ts">
import Drawer from '~/components/drawer/drawer.vue'
import { usePlaylistStore } from '~/options/playlist/store'

interface Point {
  x: number
  y: number
}

const exportResolutions = ['1080p', '4k', '8k', '16k']

const PLstore = usePlaylistStore()
// PLstore.posters 海报列表
const selectedPosters = ref<string[]>([])
watch(() => PLstore.posters, (posters) => {
  selectedPosters.value = posters
})

function highlightText() {
  const text = document.getElementById('highlightText')
  if (text) {
    let isYellow = true
    const interval = setInterval(() => {
      text.style.color = isYellow ? 'red' : 'white'
      isYellow = !isYellow
    }, 500)

    // 5秒后停止闪烁
    setTimeout(() => {
      clearInterval(interval)
      text.style.color = 'white'
    }, 5000)
  }
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
// 添加 canvas 尺寸设置
const canvasWidth = 7680
const canvasHeight = 4320
// 默认配置
const defaultConfig: GridConfig = {
  columns: 5,
  gap: 20,
  padding: 40,
  oddColumnOffset: 100, // 奇数列向上偏移10%
  evenColumnOffset: 200, // 偶数列向上偏移1/2
}

const config = ref<GridConfig>({ ...defaultConfig })

watch(() => selectedPosters.value, (_posters) => {
  generatePosterCanvas()
}, {
  immediate: true,
  deep: true,
})

// 定义分辨率映射
interface Resolution {
  width: number
  height: number
}

const resolutionMap: Record<string, Resolution> = {
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
  '8k': { width: 7680, height: 4320 },
  '16k': { width: 15360, height: 8640 },
}

// 修改导出函数
async function handleExportResolution(resolution: string) {
  if (!PLstore.userPermission) {
    highlightText()
    return
  }
  const canvas = canvasRef.value
  if (!canvas)
    return

  // 获取新的尺寸
  const newSize = resolutionMap[resolution]
  if (!newSize)
    return

  // 保存当前尺寸
  const originalWidth = canvas.width
  const originalHeight = canvas.height
  const originalConfig = { ...config.value }

  try {
    // 更新画布尺寸
    canvas.width = newSize.width
    canvas.height = newSize.height

    // 调整配置以适应新的尺寸
    config.value = {
      ...config.value,
      padding: Math.round(newSize.width * 0.02), // 2%的边距
      gap: Math.round(newSize.width * 0.01), // 1%的间距
      oddColumnOffset: Math.round(newSize.height * 0.1), // 10%的偏移
      evenColumnOffset: Math.round(newSize.height * 0.5), // 50%的偏移
    }

    // 重新生成海报
    await generatePosterCanvas({ width: newSize.width, height: newSize.height })

    // 导出图片
    const link = document.createElement('a')
    link.download = `poster-${resolution}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  catch (error) {
    console.error('Export failed:', error)
  }
  finally {
    // 恢复原始尺寸和配置
    canvas.width = originalWidth
    canvas.height = originalHeight
    config.value = originalConfig
    await generatePosterCanvas()
  }
}

// 添加配置参数接口
interface GridConfig {
  columns: number // 列数
  gap: number // 间距像素值
  padding: number // 边距
  oddColumnOffset: number // 奇数列向上偏移量（像素）
  evenColumnOffset: number // 偶数列向上偏移量（像素）
}
// 计算交错网格布局
function generateStaggeredGridPoints(width: number, height: number, images: string[], cfg: GridConfig = config.value): Point[] {
  // 计算列宽
  const totalGapWidth = cfg.gap * (cfg.columns - 1)
  const usableWidth = width - cfg.padding * 2 - totalGapWidth
  const columnWidth = usableWidth / cfg.columns

  // 预计算所有图片的尺寸
  const imageInfos = images.map((image) => {
    const imgEl = document.getElementById(image) as HTMLImageElement
    if (!imgEl)
      return null

    const aspectRatio = imgEl.naturalWidth / imgEl.naturalHeight
    const drawWidth = columnWidth
    const drawHeight = drawWidth / aspectRatio

    return {
      width: drawWidth,
      height: drawHeight,
    }
  }).filter(Boolean)

  // 计算每列的图片高度总和（用于偶数列偏移）
  const columnImageHeights = Array.from({ length: cfg.columns }, () => 0)
  let col = 0
  imageInfos.forEach((info) => {
    if (!info)
      return
    columnImageHeights[col] = info.height
    col = (col + 1) % cfg.columns
  })

  // 初始化每列的当前高度（根据奇偶列设置不同的起始高度）
  const columnHeights = Array.from({ length: cfg.columns }, (_, index) => {
    // 偶数列偏移一个图片高度的50%，奇数列偏移固定像素
    const offset = index % 2 === 0
      ? columnImageHeights[index] * 0.5 // 偶数列偏移图片高度的50%
      : cfg.oddColumnOffset // 奇数列保持固定偏移
    return cfg.padding - offset
  })

  const points: Point[] = []

  // 按列顺序放置图片
  let currentColumn = 0
  imageInfos.forEach((info) => {
    if (!info)
      return

    // 计算图片位置
    const x = cfg.padding + currentColumn * (columnWidth + cfg.gap) + info.width / 2
    const y = columnHeights[currentColumn] + info.height / 2

    points.push({ x, y })

    // 更新列高度
    columnHeights[currentColumn] += info.height + cfg.gap

    // 移动到下一列
    currentColumn = (currentColumn + 1) % cfg.columns
  })

  return points
}

// 添加创建图片元素的辅助函数
function createImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // 添加跨域支持
    img.id = src
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function generatePosterCanvas(size?: { width: number, height: number }) {
  if (!PLstore.userPermission) {
    highlightText()
    return
  }
  const canvas = canvasRef.value
  if (!canvas)
    return

  canvas.width = size?.width || canvasWidth
  canvas.height = size?.height || canvasHeight

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 确保所有图片都已加载，并且支持跨域
  try {
    await Promise.all(selectedPosters.value.map(async (poster) => {
      let imgEl = document.getElementById(poster) as HTMLImageElement | null

      // 如果图片元素不存在或没有 crossOrigin 属性，重新创建
      if (!imgEl || !imgEl.crossOrigin) {
        imgEl = await createImageElement(poster)
        // 如果已存在旧的元素，替换它
        // const oldEl = document.getElementById(poster)
        // if (oldEl)
        //   oldEl.remove()
        const wrapper = document.createElement('div')
        wrapper.style.display = 'none'
        wrapper.appendChild(imgEl)
        document.body.appendChild(wrapper)
      }
    }))
  }
  catch (error) {
    console.error('Failed to load images:', error)
    return
  }

  // 计算基础列宽
  const totalGapWidth = config.value.gap * (config.value.columns - 1)
  const usableWidth = canvas.width - config.value.padding * 2 - totalGapWidth
  const columnWidth = usableWidth / config.value.columns

  // 生成交错网格布局点位
  const points = generateStaggeredGridPoints(
    canvas.width,
    canvas.height,
    selectedPosters.value,
  )

  // 绘制图片
  selectedPosters.value.forEach((poster, index) => {
    const imgEl = document.getElementById(poster) as HTMLImageElement | null
    if (!imgEl || index >= points.length)
      return

    const point = points[index]
    const aspectRatio = imgEl.naturalWidth / imgEl.naturalHeight

    // 计算绘制尺寸（不再使用缩放）
    const drawWidth = columnWidth
    const drawHeight = drawWidth / aspectRatio

    // 居中绘制
    ctx.drawImage(
      imgEl,
      point.x - drawWidth / 2,
      point.y - drawHeight / 2,
      drawWidth,
      drawHeight,
    )
  })
}

function handleChangeSelectedPoster(poster: string) {
  // 创建新的数组来触发响应式更新
  if (selectedPosters.value.includes(poster))
    selectedPosters.value = selectedPosters.value.filter(item => item !== poster)
  else
    selectedPosters.value = [...selectedPosters.value, poster]
}
</script>

<template>
  <Drawer title="歌单海报生成" :open="PLstore.isShowPoster" position="bottom" class="bg-black" @visible-change="PLstore.isShowPoster = $event">
    <div class="h-[90vh] bg-black bg-opacity-50">
      <!-- 主容器 -->
      <div class="h-full flex flex-col p-5 gap-4">
        <!-- 顶部工具栏 -->
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-lg">导出分辨率</span>
          <div class="flex gap-3">
            <div
              v-for="resolution in exportResolutions"
              :key="resolution"
              class="text-[16px] font-bold bg-$eno-primary text-black px-2 py-1 cursor-pointer rounded-md w-20 text-center hover:bg-$eno-primary-hover transition-colors"
              @click="handleExportResolution(resolution)"
            >
              {{ resolution }}
            </div>
            <a v-if="!PLstore.userPermission" id="highlightText" class="text-lg font-bold cursor-pointer" href="https://space.bilibili.com/184327681" target="_blank">
              点击关注开发者,关注成功后刷新即可使用
            </a>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex gap-4 flex-1 min-h-0">
          <!-- 左侧画布区域 -->
          <div class="flex-1 flex items-center justify-center">
            <canvas
              ref="canvasRef"
              class="w-[90%] aspect-video bg-gray-800 object-contain"
            />
          </div>

          <!-- 右侧预览列表 -->
          <div class="w-80 flex flex-col gap-4 shrink-0">
            <div class="text-lg font-bold">
              海报预览
            </div>
            <div class="flex-1 overflow-y-auto min-h-0">
              <div
                v-for="poster in PLstore.posters"
                :key="poster"
                class="mb-3 px-3 cursor-pointer"
              >
                <div
                  class="relative hover:opacity-90 transition-opacity"
                  @click="handleChangeSelectedPoster(poster)"
                >
                  <img
                    :id="poster"
                    :src="poster"
                    crossorigin="anonymous"
                    class="w-full rounded-md"
                    :class="selectedPosters.includes(poster) ? 'border-2 border-$eno-primary' : ''"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>
