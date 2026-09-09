import { describe, expect, it } from 'vitest'
import { danmakuDensity, parseDanmakuXml, visibleDanmaku } from '~/features/player/fetchDanmaku'

const xml = `<?xml version="1.0"?><i>
<d p="1.2,1,25,16777215,0,0,a,1">前奏来了</d>
<d p="1.3,1,25,16777215,0,0,b,2">前奏来了</d>
<d p="10.0,1,25,16777215,0,0,c,3">https://b23.tv/x</d>
<d p="12.4,1,25,16777215,0,0,d,4">副歌杀我</d>
<d p="12.6,1,25,16777215,0,0,e,5">高音好稳</d>
</i>`

describe('parseDanmakuXml', () => {
  it('keeps timed text and drops urls', () => {
    const hits = parseDanmakuXml(xml)
    expect(hits.map(item => item.text)).toEqual(['前奏来了', '前奏来了', '副歌杀我', '高音好稳'])
    expect(hits[0].time).toBeCloseTo(1.2)
  })
})

describe('visibleDanmaku', () => {
  it('dedupes a window around the playhead', () => {
    const hits = parseDanmakuXml(xml)
    expect(visibleDanmaku(hits, 12.5)).toEqual(['副歌杀我', '高音好稳'])
    expect(visibleDanmaku(hits, 1.25)).toEqual(['前奏来了'])
  })
})

describe('danmakuDensity', () => {
  it('scales with nearby count', () => {
    const hits = parseDanmakuXml(xml)
    expect(danmakuDensity(hits, 12.5)).toBeGreaterThan(danmakuDensity(hits, 40))
  })
})
