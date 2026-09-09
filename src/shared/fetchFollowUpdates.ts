import type { FollowUpdateTrack } from './followUpdates'
import { getUserArc } from '~/api'
import { arcToFollowTrack, mergeFollowUpdates } from './followUpdates'
import { withRetry } from './retry'

async function fetchMidUpdates(mid: string): Promise<FollowUpdateTrack[]> {
  try {
    const res = await withRetry(() => getUserArc({
      mid,
      pn: 1,
      ps: 10,
      tid: 0,
      order: 'pubdate',
    }), { tries: 3, delayMs: 280 })
    const vlist = res?.data?.list?.vlist
    if (!Array.isArray(vlist))
      return []
    return vlist
      .map((item: Record<string, any>) => arcToFollowTrack(item, mid))
      .filter(Boolean) as FollowUpdateTrack[]
  }
  catch {
    return []
  }
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const part = await Promise.all(items.slice(i, i + size).map(fn))
    out.push(...part)
  }
  return out
}

export async function fetchFollowUpdates(mids: string[]) {
  const uniq = [...new Set(mids.map(String).filter(Boolean))].slice(0, 40)
  const groups = await mapPool(uniq, 4, fetchMidUpdates)
  return mergeFollowUpdates(groups)
}
