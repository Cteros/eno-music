import { resolveLivePlayUrl } from './fetchLiveRooms'
import { isLiveTrack } from './liveRoom'

function isUsableCdn(url?: string) {
  return Boolean(url) && !url!.startsWith('https://xy')
}

function pushUnique(list: string[], url?: string) {
  if (url && !list.includes(url))
    list.push(url)
}

const UNPLAYABLE_AUDIO = /flac|ec-3|eac3|ac-3|\bac3\b|alac/i

function backupsOf(obj: any): string[] {
  const list = obj?.backup_url || obj?.backupUrl || []
  return Array.isArray(list) ? list : []
}

export function isHtml5PlayableAudio(obj: any) {
  const codecs = String(obj?.codecs || obj?.codec || '')
  const mime = String(obj?.mimeType || obj?.mime_type || '')
  const id = Number(obj?.id)
  if (id === 30250 || id === 30251)
    return false
  if (UNPLAYABLE_AUDIO.test(codecs) || UNPLAYABLE_AUDIO.test(mime))
    return false
  return true
}

function collectStreamUrls(obj: any) {
  const urls: string[] = []
  pushUnique(urls, isUsableCdn(obj?.baseUrl) ? obj.baseUrl : '')
  pushUnique(urls, isUsableCdn(obj?.base_url) ? obj.base_url : '')
  for (const backup of backupsOf(obj))
    pushUnique(urls, isUsableCdn(backup) ? backup : '')
  return urls
}

export function collectAudioUrls(dash: any): string[] {
  const playable: string[] = []
  const fallback: string[] = []
  for (const obj of dash?.audio || []) {
    const target = isHtml5PlayableAudio(obj) ? playable : fallback
    for (const url of collectStreamUrls(obj))
      pushUnique(target, url)
  }
  return playable.length ? playable : fallback
}

export function pickAudioUrl(urls: string[] = [], skip: string[] = []) {
  return urls.find(url => url && !skip.includes(url)) || ''
}

function getUpUrl(obj: any) {
  return pickAudioUrl(collectStreamUrls(obj))
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Referer: 'https://www.bilibili.com/',
    },
  })
  if (!response.ok)
    throw new Error(`请求失败 ${response.status}`)
  const json = await response.json()
  if (json?.code && json.code !== 0)
    throw new Error(json?.message || 'B 站接口返回错误')
  return json
}

export async function resolvePlayUrl(song: Record<string, any>) {
  if (!song)
    throw new Error('没有可播放的歌曲')

  const skip: string[] = Array.isArray(song.skipUrls) ? song.skipUrls : []
  if (song.url && !skip.includes(song.url))
    return song

  if (isLiveTrack(song)) {
    const roomid = song.roomid || String(song.id || '').replace(/^live:/, '')
    if (!roomid)
      throw new Error('没有直播间')
    const url = await resolveLivePlayUrl(roomid)
    return {
      ...song,
      url,
      live: true,
    }
  }

  if (song.dash) {
    const url = pickAudioUrl(collectAudioUrls(song.dash), skip)
    if (url) {
      return {
        ...song,
        url,
      }
    }
  }

  if (song.eno_song_type === 'bvid') {
    const info = await fetchJson(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(song.bvid)}`)
    const cid = info?.data?.cid
    const dashRes = await fetchJson(`https://api.bilibili.com/x/player/playurl?fnval=16&bvid=${encodeURIComponent(song.bvid)}&cid=${cid}`)
    const dash = dashRes?.data?.dash
    const url = pickAudioUrl(collectAudioUrls(dash), skip)
    if (!url)
      throw new Error('没有可用音轨，可能需要登录')
    return {
      ...song,
      cid,
      url,
      video: getUpUrl(dash?.video?.[0]),
      dash,
    }
  }

  if (song.eno_song_type === 'cid') {
    const dashRes = await fetchJson(`https://api.bilibili.com/x/player/playurl?fnval=16&bvid=${encodeURIComponent(song.bvid)}&cid=${song.cid}`)
    const dash = dashRes?.data?.dash
    const url = pickAudioUrl(collectAudioUrls(dash), skip)
    if (!url)
      throw new Error('没有可用音轨，可能需要登录')
    return {
      ...song,
      url,
      video: getUpUrl(dash?.video?.[0]),
      dash,
    }
  }

  const sid = song.id
  const songRes = await fetchJson(`https://api.bilibili.com/audio/music-service-c/web/url?sid=${encodeURIComponent(String(sid))}`)
  const cdns: string[] = songRes?.data?.cdns || []
  const url = pickAudioUrl(cdns, skip)
  if (!url)
    throw new Error('音频地址为空')
  return {
    ...song,
    url,
    cdns,
  }
}
