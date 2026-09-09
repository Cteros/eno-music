export function isLiveTrack(song?: { eno_song_type?: string } | null) {
  return song?.eno_song_type === 'live'
}

export interface LiveRoomTrack {
  id: string
  roomid: number
  eno_song_type: 'live'
  title: string
  author: string
  cover: string
  mid: string
  album: string
  live: true
}

export function coverLive(url = '') {
  if (!url)
    return ''
  if (url.startsWith('//'))
    return `https:${url}`
  return url.replace(/^http:\/\//, 'https://')
}

export function areaItemToLiveTrack(item: Record<string, any>): LiveRoomTrack | null {
  const roomid = Number(item?.roomid)
  if (!Number.isFinite(roomid) || roomid <= 0)
    return null
  return {
    id: `live:${roomid}`,
    roomid,
    eno_song_type: 'live',
    title: String(item.title || '直播中'),
    author: String(item.uname || ''),
    cover: coverLive(item.cover || item.user_cover || item.system_cover || item.show_cover),
    mid: String(item.uid || ''),
    album: String(item.area_name || item.parent_name || '电台'),
    live: true,
  }
}

export function roomToLiveTrack(
  mid: string,
  author: string,
  data: {
    liveStatus?: number
    roomStatus?: number
    title?: string
    cover?: string
    roomid?: number
    url?: string
  },
): LiveRoomTrack | null {
  if (data.liveStatus !== 1 || !data.roomid)
    return null
  return {
    id: `live:${data.roomid}`,
    roomid: data.roomid,
    eno_song_type: 'live',
    title: String(data.title || '直播中'),
    author,
    cover: coverLive(data.cover),
    mid: String(mid),
    album: '直播',
    live: true,
  }
}

function codecPlayRank(codec: any) {
  const name = String(codec?.codec_name || codec?.codec || '')
  if (/avc|h264/i.test(name))
    return 0
  if (/hev|hvc/i.test(name))
    return 2
  return 1
}

function joinLiveUrl(host = '', base = '', extra = '') {
  if (!host || !base)
    return ''
  return `${host.replace(/\/$/, '')}${base.startsWith('/') ? base : `/${base}`}${extra || ''}`
}

export function collectLiveHlsUrls(payload: any): string[] {
  const streams = payload?.data?.playurl_info?.playurl?.stream
    || payload?.playurl_info?.playurl?.stream
    || []
  const protocolRank = ['http_hls', 'http_stream']
  const formatRank = ['fmp4', 'ts']
  const sorted = [...streams].sort((a, b) => {
    const left = protocolRank.indexOf(a?.protocol_name)
    const right = protocolRank.indexOf(b?.protocol_name)
    return (left < 0 ? 9 : left) - (right < 0 ? 9 : right)
  })
  const urls: string[] = []

  for (const stream of sorted) {
    if (stream?.protocol_name && stream.protocol_name !== 'http_hls')
      continue
    const formats = [...(stream?.format || [])].sort((a, b) => {
      const left = formatRank.indexOf(a?.format_name)
      const right = formatRank.indexOf(b?.format_name)
      return (left < 0 ? 9 : left) - (right < 0 ? 9 : right)
    })
    for (const format of formats) {
      if (!formatRank.includes(format?.format_name))
        continue
      const codecs = [...(format?.codec || [])].sort((a, b) => codecPlayRank(a) - codecPlayRank(b))
      for (const codec of codecs) {
        for (const info of codec?.url_info || []) {
          const url = joinLiveUrl(info?.host, codec?.base_url, info?.extra)
          if (url && !urls.includes(url))
            urls.push(url)
        }
      }
    }
  }
  return urls
}

export function pickLiveHlsUrl(payload: any): string {
  return collectLiveHlsUrls(payload)[0] || ''
}
