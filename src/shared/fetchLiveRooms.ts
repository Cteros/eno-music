import type { LiveRoomTrack } from './liveRoom'
import { areaItemToLiveTrack, pickLiveHlsUrl, roomToLiveTrack } from './liveRoom'
import { withRetry } from './retry'

async function readJsonOnce(url: string, referer: string) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Referer: referer,
    },
  })
  if (!response.ok)
    throw new Error(`请求失败 ${response.status}`)
  const json = await response.json()
  if (json?.code && json.code !== 0)
    throw new Error(json?.message || 'B 站接口返回错误')
  return json
}

async function readJson(url: string, referer: string) {
  return withRetry(() => readJsonOnce(url, referer), {
    tries: 4,
    delayMs: 400,
  })
}

export async function fetchLiveRoomByMid(mid: string) {
  const json = await readJson(
    `https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld?mid=${encodeURIComponent(mid)}`,
    'https://live.bilibili.com/',
  )
  return json?.data || null
}

export async function resolveLivePlayUrl(roomid: string | number) {
  const params = new URLSearchParams({
    room_id: String(roomid),
    protocol: '0,1',
    format: '0,1,2',
    codec: '0,1',
    qn: '150',
    platform: 'web',
    ptype: '8',
    dolby: '5',
    panorama: '1',
  })
  const json = await readJson(
    `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?${params}`,
    'https://live.bilibili.com/',
  )
  const url = pickLiveHlsUrl(json)
  if (!url)
    throw new Error('这个直播间没有可听的 HLS')
  return url
}

export const MUSIC_LIVE_AREAS = [
  { id: 'radio', label: '电台', parentAreaId: 5, areaId: 0 },
  { id: 'sing', label: '视频唱见', parentAreaId: 1, areaId: 21 },
] as const

export async function fetchMusicAreaLives(options?: {
  page?: number
  pageSize?: number
  parentAreaId?: number
  areaId?: number
}) {
  const page = Math.max(1, options?.page || 1)
  const pageSize = Math.min(50, Math.max(10, options?.pageSize || 30))
  const parentAreaId = options?.parentAreaId ?? 5
  const areaId = options?.areaId ?? 0
  const params = new URLSearchParams({
    platform: 'web',
    parent_area_id: String(parentAreaId),
    cate_id: '0',
    area_id: String(areaId),
    sort_type: 'online',
    page: String(page),
    page_size: String(pageSize),
  })
  const json = await readJson(
    `https://api.live.bilibili.com/room/v3/area/getRoomList?${params}`,
    'https://live.bilibili.com/',
  )
  const list = Array.isArray(json?.data?.list) ? json.data.list : []
  const rooms = list.map((item: Record<string, any>) => areaItemToLiveTrack(item)).filter(Boolean) as LiveRoomTrack[]
  const total = Number(json?.data?.count) || 0
  return {
    rooms,
    total,
    hasMore: rooms.length >= pageSize && page * pageSize < (total || page * pageSize + 1),
  }
}

export async function fetchFollowedLives(
  mids: string[],
  names: Record<string, string> = {},
): Promise<LiveRoomTrack[]> {
  const uniq = [...new Set(mids.map(String).filter(Boolean))].slice(0, 12)
  const rows = await Promise.all(uniq.map(async (mid) => {
    try {
      const data = await fetchLiveRoomByMid(mid)
      return roomToLiveTrack(mid, names[mid] || names[String(mid)] || '', data)
    }
    catch {
      return null
    }
  }))
  return rows.filter(Boolean) as LiveRoomTrack[]
}
