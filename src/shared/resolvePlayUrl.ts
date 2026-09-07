function isUsableCdn(url?: string) {
  return Boolean(url) && !url!.startsWith('https://xy')
}

function pushUnique(list: string[], url?: string) {
  if (url && !list.includes(url))
    list.push(url)
}

export function collectAudioUrls(dash: any): string[] {
  const urls: string[] = []
  for (const obj of dash?.audio || []) {
    pushUnique(urls, isUsableCdn(obj?.baseUrl) ? obj.baseUrl : '')
    for (const backup of obj?.backup_url || [])
      pushUnique(urls, isUsableCdn(backup) ? backup : '')
  }
  return urls
}

export function pickAudioUrl(urls: string[] = [], skip: string[] = []) {
  return urls.find(url => url && !skip.includes(url)) || ''
}

function getUpUrl(obj: any) {
  return pickAudioUrl([
    obj?.baseUrl || '',
    obj?.backup_url?.[0] || '',
    obj?.backup_url?.[1] || '',
  ].filter(isUsableCdn))
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
