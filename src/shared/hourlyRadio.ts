export const RADIO_MIN_SEC = 45 * 60
export const RADIO_MAX_SEC = 60 * 60
export const RADIO_MAX_TRACK_SEC = 15 * 60
export const RADIO_MIN_TRACK_SEC = 45

export interface RadioTrack {
  id: string
  bvid: string
  title: string
  author: string
  cover: string
  duration: number
  mid: string
  eno_song_type: 'bvid'
  album: string
}

export function parseClockDuration(input: unknown, fallback = 240) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    if (input <= 0)
      return fallback
    return input > 100_000 ? Math.round(input / 1000) : Math.round(input)
  }
  const text = String(input || '').trim()
  if (!text)
    return fallback
  const parts = text.split(':').map(Number)
  if (parts.some(part => !Number.isFinite(part)))
    return fallback
  if (parts.length === 3)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2)
    return parts[0] * 60 + parts[1]
  if (parts.length === 1)
    return parts[0]
  return fallback
}

export function coverHttps(url = '') {
  if (!url)
    return ''
  if (url.startsWith('//'))
    return `https:${url}`
  return url.replace(/^http:\/\//, 'https://')
}

export function arcToRadioTrack(item: Record<string, any>, mid: string, album = '关注电台'): RadioTrack | null {
  const bvid = String(item?.bvid || '')
  if (!bvid)
    return null
  return {
    id: bvid,
    bvid,
    title: String(item.title || '未命名'),
    author: String(item.author || item.owner?.name || ''),
    cover: coverHttps(item.pic || item.cover || ''),
    duration: parseClockDuration(item.length ?? item.duration),
    mid: String(mid),
    eno_song_type: 'bvid',
    album,
  }
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function daySeed(date = new Date()) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

function shuffle<T>(list: T[], rand: () => number) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

export function isRadioLength(duration: number) {
  return duration >= RADIO_MIN_TRACK_SEC && duration <= RADIO_MAX_TRACK_SEC
}

export function buildHourlyRadio(
  groups: RadioTrack[][],
  options?: { minSec?: number, maxSec?: number, seed?: number, album?: string },
) {
  const minSec = options?.minSec ?? RADIO_MIN_SEC
  const maxSec = options?.maxSec ?? RADIO_MAX_SEC
  const album = options?.album ?? '关注电台'
  const rand = mulberry32(options?.seed ?? daySeed())
  const queues = groups
    .map(group => shuffle(group.filter(track => isRadioLength(track.duration)), rand))
    .filter(group => group.length)

  const set: RadioTrack[] = []
  const seen = new Set<string>()
  let total = 0
  let progressed = true

  while (total < minSec && progressed) {
    progressed = false
    for (const queue of queues) {
      while (queue.length) {
        const track = queue.shift()
        if (!track || seen.has(track.bvid))
          continue
        if (total + track.duration > maxSec) {
          if (total >= minSec)
            return set
          continue
        }
        seen.add(track.bvid)
        set.push({ ...track, album })
        total += track.duration
        progressed = true
        break
      }
      if (total >= minSec)
        return set
    }
  }

  return set
}
