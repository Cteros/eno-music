import { describe, expect, it } from 'vitest'
import {
  extractWords,
  mergeAuxTrack,
  needsWordSpace,
  normalizeSubtitleUrl,
  parseLyricBody,
  splitLyricTokens,
  synthesizeWords,
} from '~/features/player/fetchLyrics'

describe('normalizeSubtitleUrl', () => {
  it('handles protocol-relative and http urls', () => {
    expect(normalizeSubtitleUrl('//aisubtitle.hdslb.com/a.json')).toBe('https://aisubtitle.hdslb.com/a.json')
    expect(normalizeSubtitleUrl('http://a.b/x.json')).toBe('https://a.b/x.json')
    expect(normalizeSubtitleUrl('https://a.b/x.json')).toBe('https://a.b/x.json')
    expect(normalizeSubtitleUrl('')).toBe('')
    expect(normalizeSubtitleUrl(undefined)).toBe('')
  })
})

describe('splitLyricTokens', () => {
  it('splits CJK per character and latin per word', () => {
    expect(splitLyricTokens('你好 world')).toEqual(['你', '好', 'world'])
    expect(splitLyricTokens('かな よい')).toEqual(['か', 'な', 'よ', 'い'])
    expect(splitLyricTokens('Never gonna')).toEqual(['Never', 'gonna'])
  })

  it('keeps punctuation glued to its word', () => {
    expect(splitLyricTokens('up, never!')).toEqual(['up,', 'never!'])
  })
})

describe('needsWordSpace', () => {
  it('adds space only between latin tokens', () => {
    expect(needsWordSpace('Never', 'gonna')).toBe(true)
    expect(needsWordSpace('你', '好')).toBe(false)
    expect(needsWordSpace('好', 'world')).toBe(false)
  })
})

describe('synthesizeWords', () => {
  it('covers the whole line window with non-overlapping words', () => {
    const words = synthesizeWords('你好世界', 10, 14)
    expect(words).toHaveLength(4)
    expect(words[0].from).toBeCloseTo(10)
    expect(words.at(-1)!.to).toBeCloseTo(14)
    for (let i = 1; i < words.length; i++)
      expect(words[i].from).toBeCloseTo(words[i - 1].to)
  })

  it('returns empty for empty content', () => {
    expect(synthesizeWords('', 0, 1)).toEqual([])
  })
})

describe('extractWords', () => {
  it('reads word arrays when the source provides them', () => {
    const words = extractWords({
      words: [
        { text: 'Never', from: 0, to: 0.5 },
        { text: 'gonna', from: 0.5, to: 1 },
      ],
    })
    expect(words).toHaveLength(2)
    expect(words![1]).toEqual({ text: 'gonna', from: 0.5, to: 1 })
  })

  it('falls back to null when no word data', () => {
    expect(extractWords({ content: 'hello' })).toBeNull()
  })
})

describe('parseLyricBody', () => {
  it('normalizes lines and always attaches words', () => {
    const lines = parseLyricBody([
      { from: 1, to: 3, content: 'hello <b>world</b>' },
      { from: 3, to: 5, content: '' },
    ])
    expect(lines).toHaveLength(1)
    expect(lines[0].content).toBe('hello world')
    expect(lines[0].words.length).toBeGreaterThan(1)
  })
})

describe('mergeAuxTrack', () => {
  it('aligns translation lines by time midpoint', () => {
    const lines = parseLyricBody([
      { from: 0, to: 2, content: '主句' },
      { from: 2, to: 4, content: '第二句' },
    ]) as any[]
    const aux = parseLyricBody([
      { from: 0, to: 2, content: 'main line' },
      { from: 2, to: 4, content: 'second line' },
    ])
    const merged = mergeAuxTrack(lines, aux, 'translation')
    expect(merged).toBe(2)
    expect(lines[0].translation).toBe('main line')
    expect(lines[1].translation).toBe('second line')
  })

  it('does not attach far-away aux lines', () => {
    const lines = parseLyricBody([{ from: 0, to: 2, content: '主句' }]) as any[]
    const aux = parseLyricBody([{ from: 60, to: 62, content: 'later' }])
    expect(mergeAuxTrack(lines, aux, 'translation')).toBe(0)
    expect(lines[0].translation).toBeUndefined()
  })
})
