import { encWbi, getWbiKeys } from '~/api/wbi'
import { sendExtMessage } from '~/shared/chromeApi'
import { stripHtml } from '~/shared/playerBridge'
import { zhError } from '~/shared/zhError'

export interface LyricWord {
  text: string
  from: number
  to: number
}

export interface LyricLine {
  from: number
  to: number
  content: string
  words: LyricWord[]
  translation?: string
  romaji?: string
}

export interface LyricDoc {
  lines: LyricLine[]
  hasTranslation: boolean
  hasRomaji: boolean
  /** 有值表示获取失败（此时 lines 为空），UI 可展示原因并提供重试 */
  error?: string
}

export function emptyLyricDoc(): LyricDoc {
  return {
    lines: [],
    hasTranslation: false,
    hasRomaji: false,
  }
}

/**
 * 中日韩逐字、拉丁按词切分。连续的 CJK 假名/汉字一字一拍，
 * 其余（英文单词、数字、标点簇）整体一拍。
 */
export function splitLyricTokens(content: string): string[] {
  const tokens: string[] = []
  const chars = [...content]
  let buffer = ''
  const flush = () => {
    if (buffer) {
      tokens.push(buffer)
      buffer = ''
    }
  }
  for (const ch of chars) {
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch)) {
      flush()
      tokens.push(ch)
    }
    else if (/\s/.test(ch)) {
      flush()
    }
    else {
      buffer += ch
    }
  }
  flush()
  return tokens
}

/** 渲染逐字序列时，拉丁词之间要补回空格（CJK 与拉丁边界不加） */
export function needsWordSpace(a: string, b: string) {
  if (!a || !b)
    return false
  const isLatinish = (ch: string) =>
    /[\p{L}\p{N}]/u.test(ch)
    && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch)
  const end = [...a].at(-1) || ''
  const start = [...b][0] || ''
  return isLatinish(end) && isLatinish(start)
}

/**
 * 按字符宽度把 [from,to] 分摊成逐字时间。CJK 权重 1，拉丁/数字权重 0.55，
 * 让英文单词不会被拉得过长。
 */
export function synthesizeWords(content: string, from: number, to: number): LyricWord[] {
  const tokens = splitLyricTokens(content)
  if (!tokens.length)
    return []
  const duration = Math.max(0, to - from)
  const weights = tokens.map((token) => {
    if (/^[\p{L}\p{N}]+$/u.test(token) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(token))
      return Math.max(1, [...token].length * 0.55)
    return Math.max(1, [...token].length)
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1
  let cursor = from
  return tokens.map((token, index) => {
    const span = (weights[index] / total) * duration
    const word = { text: token, from: cursor, to: cursor + span }
    cursor += span
    return word
  })
}

function normalizeWord(raw: any): LyricWord | null {
  const text = stripHtml(String(raw?.text ?? raw?.word ?? raw?.content ?? '')).replace(/\s+/g, ' ').trim()
  const from = Number(raw?.from ?? raw?.start ?? raw?.time)
  const to = Number(raw?.to ?? raw?.end ?? raw?.endTime)
  if (!text || !Number.isFinite(from))
    return null
  return {
    text,
    from,
    to: Number.isFinite(to) ? Math.max(to, from) : from + 0.3,
  }
}

/** 词级数据：兼容 words / word_times / yrc 单元等常见形态 */
export function extractWords(line: any): LyricWord[] | null {
  const raw = line?.words ?? line?.word_times ?? line?.yrc_words
  if (!Array.isArray(raw) || !raw.length)
    return null
  const words = raw.map(normalizeWord).filter(Boolean) as LyricWord[]
  return words.length ? words : null
}

interface RawLine {
  from: number
  to: number
  content: string
  words: LyricWord[]
}

export function parseLyricBody(body: any[]): RawLine[] {
  return (Array.isArray(body) ? body : [])
    .map((item: any) => {
      const content = stripHtml(String(item?.content || '')).replace(/\n/g, ' ').trim()
      const from = Number(item?.from) || 0
      const to = Number(item?.to) || (from + Math.max(1.2, content.length * 0.18))
      const words = extractWords(item) || synthesizeWords(content, from, to)
      return { from, to, content, words }
    })
    .filter(line => line.content)
}

function pickMainLan(subtitles: any[]): any | undefined {
  const lanOf = (item: any) => String(item?.lan || '').toLowerCase()
  return subtitles.find(item => lanOf(item) === 'zh-cn')
    || subtitles.find(item => lanOf(item) === 'ai-zh')
    || subtitles.find(item => lanOf(item).startsWith('zh'))
    || subtitles.find(item => lanOf(item).includes('ai-zh'))
    || subtitles.find(item => lanOf(item).includes('zh'))
    || subtitles[0]
}

function pickByLan(subtitles: any[], patterns: RegExp[]): any | undefined {
  return subtitles.find(item => patterns.some(re => re.test(String(item?.lan || '').toLowerCase())))
}

/** 把另一条字幕轨按时间中点对齐合并进主轨 */
export function mergeAuxTrack(lines: LyricLine[], aux: RawLine[], field: 'translation' | 'romaji') {
  if (!lines.length || !aux.length)
    return 0
  const sorted = [...aux].sort((a, b) => a.from - b.from)
  let cursor = 0
  let merged = 0
  for (const line of lines) {
    const mid = (line.from + line.to) / 2
    while (cursor < sorted.length - 1 && sorted[cursor + 1].from <= mid)
      cursor++
    const candidate = sorted[cursor]
    if (candidate && mid >= candidate.from - 0.6 && mid <= candidate.to + 0.6 && candidate.content) {
      line[field] = candidate.content
      merged++
    }
  }
  return merged
}

const FETCH_TIMEOUT = 8000
const TOTAL_BUDGET = 12000

function withTimeout<T>(pending: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    pending,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}超时`)), ms)
    }),
  ])
}

/**
 * 统一走 background 文本通道：页面上下文设不了 Referer，
 * 而 webext-fetch 的 efetch 对非 JSON 响应无 catch 会永久挂起。
 */
async function fetchText(url: string): Promise<string> {
  const result = await withTimeout(
    sendExtMessage({ target: 'background', type: 'ENO_FETCH_TEXT', url }),
    FETCH_TIMEOUT,
    '字幕请求',
  )
  if (!result?.ok)
    throw new Error(result?.error || '字幕请求失败')
  return String(result?.data?.text || '')
}

async function fetchJsonSafe(url: string): Promise<any> {
  const text = await fetchText(url)
  const trimmed = text.trim()
  if (!trimmed || trimmed.startsWith('<'))
    throw new Error('字幕接口返回了网页而不是数据')
  return JSON.parse(trimmed)
}

export function normalizeSubtitleUrl(raw?: string): string {
  const value = String(raw || '').trim()
  if (!value)
    return ''
  if (value.startsWith('//'))
    return `https:${value}`
  if (value.startsWith('http://'))
    return `https://${value.slice('http://'.length)}`
  return value
}

/** 字幕列表：x/player/wbi/v2（官方客户端同款，带 WBI 签名），失败退回无签名 */
async function fetchSubtitleList(song: { bvid?: string, cid?: string | number, aid?: string | number }): Promise<any[]> {
  // 注意 encWbi 会往 params 里塞 wts，兜底 URL 必须用干净副本
  const base: Record<string, string> = { cid: String(song.cid) }
  if (song.bvid)
    base.bvid = String(song.bvid)
  if (song.aid != null && song.aid !== '')
    base.aid = String(song.aid)

  const urls: string[] = []
  try {
    const keys = await withTimeout(getWbiKeys(), FETCH_TIMEOUT, 'WBI 签名')
    urls.push(`https://api.bilibili.com/x/player/wbi/v2?${encWbi({ ...base }, keys.img_key, keys.sub_key)}`)
  }
  catch {
    // 签名服务不可用时仍可试无签名接口
  }
  urls.push(`https://api.bilibili.com/x/player/wbi/v2?${new URLSearchParams({ ...base })}`)
  urls.push(`https://api.bilibili.com/x/player/v2?${new URLSearchParams({ ...base })}`)

  let lastError: unknown
  for (const url of urls) {
    try {
      const json = await fetchJsonSafe(url)
      if (json?.code && json.code !== 0) {
        console.warn('[lyrics] player api code', json.code, json.message || '')
        continue
      }
      const subtitles = json?.data?.subtitle?.subtitles
      if (Array.isArray(subtitles))
        return subtitles
    }
    catch (error) {
      lastError = error
    }
  }
  if (lastError)
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  return []
}

async function fetchSubtitleBody(subtitle: any): Promise<any[]> {
  const url = normalizeSubtitleUrl(subtitle?.subtitle_url)
  if (!url)
    return []
  const json = await fetchJsonSafe(url)
  return Array.isArray(json?.body) ? json.body : []
}

async function loadLyrics(song: { bvid?: string, cid?: string | number, aid?: string | number }): Promise<LyricDoc> {
  const bvid = song?.bvid
  if (!bvid)
    return emptyLyricDoc()

  let cid = song.cid
  if (!cid) {
    const info = await fetchJsonSafe(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`)
    cid = info?.data?.cid
  }
  if (!cid)
    return emptyLyricDoc()

  const subtitles = (await fetchSubtitleList({ ...song, cid })).filter(item => normalizeSubtitleUrl(item?.subtitle_url))
  const main = pickMainLan(subtitles)
  const mainBody = await fetchSubtitleBody(main)
  const lines: LyricLine[] = parseLyricBody(mainBody)

  const mainLan = String(main?.lan || '').toLowerCase().replace(/^ai-/, '')
  const sameLang = (item: any) => {
    const lan = String(item?.lan || '').toLowerCase().replace(/^ai-/, '')
    return Boolean(lan && mainLan && lan.slice(0, 2) === mainLan.slice(0, 2))
  }
  const rest = subtitles.filter(item => item !== main)
  const translationTrack = rest.find(item => !sameLang(item) && !/romaji|^ro/i.test(String(item?.lan || '')))
  const romajiTrack = pickByLan(rest, [/romaji/, /^ro$/, /ai-ro/])

  // 翻译/罗马音轨失败不影响主歌词
  let hasTranslation = false
  let hasRomaji = false
  if (translationTrack) {
    try {
      hasTranslation = mergeAuxTrack(lines, parseLyricBody(await fetchSubtitleBody(translationTrack)), 'translation') > 0
    }
    catch {
      hasTranslation = false
    }
  }
  if (romajiTrack) {
    try {
      hasRomaji = mergeAuxTrack(lines, parseLyricBody(await fetchSubtitleBody(romajiTrack)), 'romaji') > 0
    }
    catch {
      hasRomaji = false
    }
  }

  return { lines, hasTranslation, hasRomaji }
}

/**
 * 永不抛错：失败时返回 error 字段供 UI 展示并允许重试。
 * 总预算兜底 + 一次整链重试，避免偶发网络抖动直接判死。
 */
export async function fetchLyrics(song: { bvid?: string, cid?: string | number, aid?: string | number } | null): Promise<LyricDoc> {
  if (!song?.bvid)
    return emptyLyricDoc()

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withTimeout(loadLyrics(song), TOTAL_BUDGET, '歌词')
    }
    catch (error) {
      const message = zhError(error, '歌词加载失败，请稍后重试')
      console.warn(`[lyrics] attempt ${attempt + 1} failed`, message)
      if (attempt === 1)
        return { ...emptyLyricDoc(), error: message }
    }
  }
  return emptyLyricDoc()
}
