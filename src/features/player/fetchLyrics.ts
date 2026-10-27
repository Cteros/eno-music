import { fetchRemoteJson, getPlayerV2, useApiClient } from '~/api'
import { stripHtml } from '~/shared/playerBridge'

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

async function fetchSubtitleBody(subtitle: any): Promise<any[]> {
  const url = subtitle?.subtitle_url
  if (!url)
    return []
  const json = await fetchRemoteJson(url) as any
  return Array.isArray(json?.body) ? json.body : []
}

export async function fetchLyrics(song: { bvid?: string, cid?: string | number } | null): Promise<LyricDoc> {
  const bvid = song?.bvid
  if (!bvid)
    return emptyLyricDoc()

  let cid = song.cid
  if (!cid) {
    const api = useApiClient()
    const info = await api.blbl.getVideoInfo({ bvid })
    cid = info?.data?.cid
  }
  if (!cid)
    return emptyLyricDoc()

  const player = await getPlayerV2({ bvid, cid }) as any
  const subtitles: any[] = Array.isArray(player?.data?.subtitle?.subtitles)
    ? player.data.subtitle.subtitles
    : []
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

  let hasTranslation = false
  let hasRomaji = false
  if (translationTrack) {
    hasTranslation = mergeAuxTrack(lines, parseLyricBody(await fetchSubtitleBody(translationTrack)), 'translation') > 0
  }
  if (romajiTrack) {
    hasRomaji = mergeAuxTrack(lines, parseLyricBody(await fetchSubtitleBody(romajiTrack)), 'romaji') > 0
  }

  return { lines, hasTranslation, hasRomaji }
}
