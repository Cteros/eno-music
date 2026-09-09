import { arcToRadioTrack, coverHttps } from './hourlyRadio'

export interface FollowUpdateTrack {
  id: string
  bvid: string
  title: string
  author: string
  cover: string
  duration: number
  mid: string
  created: number
  eno_song_type: 'bvid'
  album: string
  pubAgo?: string
}

export function createdUnix(input: unknown) {
  const n = Number(input)
  if (!Number.isFinite(n) || n <= 0)
    return 0
  return n > 1e12 ? Math.round(n / 1000) : Math.round(n)
}

export function formatPubAgo(created: number, now = Date.now()) {
  const at = createdUnix(created)
  if (!at)
    return ''
  const diff = Math.max(0, Math.floor(now / 1000 - at))
  if (diff < 60)
    return '刚刚'
  if (diff < 3600)
    return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7)
    return `${Math.floor(diff / 86400)} 天前`
  const date = new Date(at * 1000)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function arcToFollowTrack(item: Record<string, any>, mid: string): FollowUpdateTrack | null {
  const track = arcToRadioTrack(item, mid, '关注更新')
  if (!track)
    return null
  return {
    ...track,
    cover: coverHttps(track.cover),
    created: createdUnix(item.created ?? item.pubdate ?? item.ctime),
  }
}

export function mergeFollowUpdates(groups: FollowUpdateTrack[][], now = Date.now()) {
  const seen = new Set<string>()
  const all = groups.flat().sort((a, b) => b.created - a.created)
  const out: FollowUpdateTrack[] = []
  for (const track of all) {
    if (!track?.bvid || seen.has(track.bvid))
      continue
    seen.add(track.bvid)
    out.push({
      ...track,
      pubAgo: formatPubAgo(track.created, now),
    })
  }
  const cutoff = Math.floor(now / 1000) - 60 * 86400
  const recent = out.filter(track => !track.created || track.created >= cutoff)
  return (recent.length ? recent : out).slice(0, 120)
}
