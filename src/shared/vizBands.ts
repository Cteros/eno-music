export interface VizBands {
  bass: number
  mid: number
  high: number
}

export const EMPTY_VIZ: VizBands = {
  bass: 0,
  mid: 0,
  high: 0,
}

function mean(data: ArrayLike<number>, from: number, to: number) {
  const start = Math.max(0, Math.min(from, data.length))
  const end = Math.max(start + 1, Math.min(to, data.length))
  let sum = 0
  for (let i = start; i < end; i++)
    sum += data[i] || 0
  return sum / (end - start) / 255
}

export function bandsFromSpectrum(data: ArrayLike<number>): VizBands {
  if (!data.length)
    return { ...EMPTY_VIZ }
  return {
    bass: Math.min(1, mean(data, 1, 6) * 1.35),
    mid: Math.min(1, mean(data, 8, 24)),
    high: Math.min(1, mean(data, 32, Math.min(80, data.length))),
  }
}
