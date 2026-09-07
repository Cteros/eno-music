export interface CoverPalette {
  accent: string
  wash: string
  dim: string
}

export const EMPTY_PALETTE: CoverPalette = {
  accent: '#1ed760',
  wash: '#121212',
  dim: '#121212',
}

function toRgb(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`
}

function luma(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function saturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const d = max - min
  const l = (max + min) / 2
  if (d === 0)
    return 0
  return d / (1 - Math.abs(2 * l - 1))
}

export function paletteFromPixels(data: Uint8ClampedArray): CoverPalette {
  let accent = { r: 30, g: 215, b: 96, score: -1 }
  let washR = 0
  let washG = 0
  let washB = 0
  let washN = 0

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128)
      continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const y = luma(r, g, b)
    if (y < 0.08 || y > 0.92)
      continue
    const s = saturation(r, g, b)
    washR += r
    washG += g
    washB += b
    washN++
    const score = s * 1.4 + (1 - Math.abs(y - 0.45))
    if (score > accent.score) {
      accent = { r, g, b, score }
    }
  }

  if (washN === 0) {
    return { ...EMPTY_PALETTE }
  }

  const wr = washR / washN
  const wg = washG / washN
  const wb = washB / washN
  const base = 18
  return {
    accent: toRgb(accent.r, accent.g, accent.b),
    wash: toRgb(wr * 0.22 + base * 0.78, wg * 0.22 + base * 0.78, wb * 0.22 + base * 0.78),
    dim: toRgb(wr * 0.1 + base * 0.9, wg * 0.1 + base * 0.9, wb * 0.1 + base * 0.9),
  }
}

export function normalizeCoverUrl(url = '') {
  if (!url)
    return ''
  if (url.startsWith('//'))
    return `https:${url}`
  if (url.startsWith('http://'))
    return `https://${url.slice('http://'.length)}`
  return url
}

export async function extractCoverPalette(url: string): Promise<CoverPalette | null> {
  const href = normalizeCoverUrl(url)
  if (!href)
    return null
  const response = await fetch(href)
  if (!response.ok)
    throw new Error(`cover fetch ${response.status}`)
  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob)
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx)
    return null
  ctx.drawImage(bitmap, 0, 0, size, size)
  bitmap.close()
  return paletteFromPixels(ctx.getImageData(0, 0, size, size).data)
}
