import type { RadioTrack } from './hourlyRadio'
import { getUserArc } from '~/api'
import { arcToRadioTrack, buildHourlyRadio, daySeed } from './hourlyRadio'

async function fetchMidArcs(mid: string): Promise<RadioTrack[]> {
  const tryOnce = async (tid?: number) => {
    const params: Record<string, string | number> = {
      mid,
      pn: 1,
      ps: 12,
      order: 'pubdate',
    }
    if (tid != null)
      params.tid = tid
    const res = await getUserArc(params)
    const vlist = res?.data?.list?.vlist
    if (!Array.isArray(vlist))
      return []
    return vlist
      .map((item: Record<string, any>) => arcToRadioTrack(item, mid))
      .filter(Boolean) as RadioTrack[]
  }

  try {
    const music = await tryOnce(3)
    if (music.length)
      return music
    return await tryOnce(0)
  }
  catch {
    return []
  }
}

export async function fetchHourlyRadio(mids: string[]) {
  const uniq = [...new Set(mids.map(String).filter(Boolean))].slice(0, 10)
  const groups = await Promise.all(uniq.map(mid => fetchMidArcs(mid)))
  const date = new Date()
  const album = `关注电台 · ${date.getMonth() + 1}月${date.getDate()}日`
  return buildHourlyRadio(groups, {
    seed: daySeed(date),
    album,
  })
}
