export const CROSSFADE_MS = 800
export const CROSSFADE_PRIME_S = 8

export function crossfadeDurationMs(options: {
  enabled: boolean
  hasOutgoing: boolean
  outgoingPlaying: boolean
  sameTrack?: boolean
  volume: number
  remainingMs?: number
}) {
  if (!options.enabled || !options.hasOutgoing || !options.outgoingPlaying || options.sameTrack || options.volume <= 0)
    return 0
  const cap = options.remainingMs ?? CROSSFADE_MS
  if (cap < 60)
    return 0
  return Math.round(Math.min(CROSSFADE_MS, cap))
}

export function shouldPrimeNext(options: {
  enabled: boolean
  playing: boolean
  loopMode: string
  sleepAfterCurrent: boolean
  locked: boolean
  primed: boolean
  hasNext: boolean
  current: number
  total: number
}) {
  if (!options.enabled || !options.playing || options.locked || options.primed || options.sleepAfterCurrent)
    return false
  if (!options.hasNext || options.loopMode === 'single')
    return false
  if (options.total < 6)
    return false
  const remain = options.total - options.current
  return remain > 1 && remain <= CROSSFADE_PRIME_S
}

export function shouldOverlapBeforeEnd(options: {
  enabled: boolean
  playing: boolean
  loopMode: string
  sleepAfterCurrent: boolean
  locked: boolean
  hasNext: boolean
  current: number
  total: number
}) {
  if (!options.enabled || !options.playing || options.locked || options.sleepAfterCurrent)
    return false
  if (!options.hasNext || options.loopMode === 'single')
    return false
  if (options.total < 6)
    return false
  const remainMs = (options.total - options.current) * 1000
  return remainMs > 0 && remainMs <= CROSSFADE_MS + 80
}
