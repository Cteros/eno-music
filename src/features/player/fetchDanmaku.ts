export interface DanmakuHit {
  time: number
  text: string
}

const MAX_STORED = 4000
const SKIP = /https?:\/\/|www\.|^\s*$/

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&apos;/g, '\'')
}

export function normalizeDanmakuText(input: string) {
  return input
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\p{Script=Han} ]+/gu, '')
    .trim()
    .slice(0, 36)
}

export function parseDanmakuXml(xml: string): DanmakuHit[] {
  const hits: DanmakuHit[] = []
  const re = /<d p="([^"]*)"[^>]*>([^<]*)<\/d>/g
  let match = re.exec(xml)
  while (match) {
    const time = Number(String(match[1] || '').split(',')[0])
    const text = decodeXml(match[2] || '').replace(/\s+/g, ' ').trim()
    if (Number.isFinite(time) && text && !SKIP.test(text) && text.length < 48)
      hits.push({ time, text })
    match = re.exec(xml)
  }
  if (hits.length <= MAX_STORED)
    return hits
  const stride = Math.ceil(hits.length / MAX_STORED)
  return hits.filter((_, index) => index % stride === 0).slice(0, MAX_STORED)
}

export function visibleDanmaku(items: DanmakuHit[], current: number, limit = 7) {
  const from = current - 1.8
  const to = current + 0.4
  const seen = new Set<string>()
  const picked: { text: string, dist: number }[] = []
  for (const item of items) {
    if (item.time < from || item.time > to)
      continue
    const key = normalizeDanmakuText(item.text).toLowerCase()
    if (!key || seen.has(key))
      continue
    seen.add(key)
    picked.push({ text: item.text.slice(0, 28), dist: Math.abs(item.time - current) })
  }
  picked.sort((a, b) => a.dist - b.dist)
  return picked.slice(0, limit).map(item => item.text)
}

export function danmakuDensity(items: DanmakuHit[], current: number) {
  let count = 0
  for (const item of items) {
    if (Math.abs(item.time - current) <= 2)
      count++
  }
  return Math.min(1, count / 24)
}

async function readXml(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Referer: 'https://www.bilibili.com/',
    },
  })
  if (!response.ok)
    throw new Error(`弹幕 ${response.status}`)
  return response.text()
}

export async function fetchDanmaku(cid?: string | number | null): Promise<DanmakuHit[]> {
  if (cid == null || cid === '')
    return []
  const oid = encodeURIComponent(String(cid))
  try {
    const xml = await readXml(`https://api.bilibili.com/x/v1/dm/list.so?oid=${oid}`)
    const hits = parseDanmakuXml(xml)
    if (hits.length)
      return hits
  }
  catch {
    // fall through to comment CDN
  }
  try {
    const xml = await readXml(`https://comment.bilibili.com/${oid}.xml`)
    return parseDanmakuXml(xml)
  }
  catch {
    return []
  }
}
