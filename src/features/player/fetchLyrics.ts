import { fetchRemoteJson, getPlayerV2, useApiClient } from '~/api'
import { stripHtml } from '~/shared/playerBridge'

export interface LyricLine {
  from: number
  to: number
  content: string
}

function pickSubtitle(subtitles: any[] = []) {
  return subtitles.find((item: any) => item?.lan === 'ai-zh')
    || subtitles.find((item: any) => String(item?.lan || '').includes('zh'))
    || subtitles[0]
}

export async function fetchLyrics(song: { bvid?: string, cid?: string | number } | null): Promise<LyricLine[]> {
  const bvid = song?.bvid
  if (!bvid)
    return []

  let cid = song.cid
  if (!cid) {
    const api = useApiClient()
    const info = await api.blbl.getVideoInfo({ bvid })
    cid = info?.data?.cid
  }
  if (!cid)
    return []

  const player = await getPlayerV2({ bvid, cid })
  const subtitle = pickSubtitle(player?.data?.subtitle?.subtitles)
  const url = subtitle?.subtitle_url
  if (!url)
    return []

  const json = await fetchRemoteJson(url)
  const body = Array.isArray(json?.body) ? json.body : []
  return body
    .map((line: any) => ({
      from: Number(line.from) || 0,
      to: Number(line.to) || 0,
      content: stripHtml(String(line.content || '')).replace(/\n/g, ' '),
    }))
    .filter((line: LyricLine) => line.content)
}
