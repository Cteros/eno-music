import { describe, expect, it } from 'vitest'
import {
  findTrackIndex,
  formatPlaybackRate,
  formatPlayerTime,
  loopModeLabel,
  nextLoopMode,
  nextPlaybackRate,
  sameTrack,
  songKey,
} from '~/shared/playerBridge'

describe('nextPlaybackRate', () => {
  it('cycles through the rate list', () => {
    expect(nextPlaybackRate(1)).toBe(1.25)
    expect(nextPlaybackRate(2)).toBe(0.75)
    expect(nextPlaybackRate(0.8)).toBe(0.75)
  })
})

describe('formatPlaybackRate', () => {
  it('renders a compact label', () => {
    expect(formatPlaybackRate(1)).toBe('1×')
    expect(formatPlaybackRate(1.25)).toBe('1.25×')
    expect(formatPlaybackRate(2)).toBe('2×')
  })
})

describe('loop mode', () => {
  it('cycles list → single → random → list', () => {
    expect(nextLoopMode('list')).toBe('single')
    expect(nextLoopMode('single')).toBe('random')
    expect(nextLoopMode('random')).toBe('list')
    expect(nextLoopMode('unknown')).toBe('single')
  })

  it('labels modes in Chinese', () => {
    expect(loopModeLabel('list')).toBe('列表循环')
    expect(loopModeLabel('single')).toBe('单曲循环')
    expect(loopModeLabel('random')).toBe('随机播放')
  })
})

describe('formatPlayerTime', () => {
  it('pads minutes and seconds', () => {
    expect(formatPlayerTime(0)).toBe('00:00')
    expect(formatPlayerTime(65)).toBe('01:05')
    expect(formatPlayerTime(-3)).toBe('00:00')
  })
})

describe('songKey', () => {
  it('distinguishes pages of the same BV', () => {
    expect(songKey({ bvid: 'BV1', cid: 1 })).toBe('cid:BV1:1')
    expect(songKey({ bvid: 'BV1', cid: 2 })).toBe('cid:BV1:2')
    expect(songKey({ bvid: 'BV1', cid: 1 })).not.toBe(songKey({ bvid: 'BV1', cid: 2 }))
  })

  it('keys live rooms separately', () => {
    expect(songKey({ eno_song_type: 'live', roomid: 88 })).toBe('live:88')
  })
})

describe('findTrackIndex', () => {
  const album = [
    { bvid: 'BV1', cid: 1 },
    { bvid: 'BV1', cid: 2 },
    { bvid: 'BV1', cid: 3 },
  ]

  it('finds the exact page, not the first page of the same BV', () => {
    expect(findTrackIndex(album, { bvid: 'BV1', cid: 2 })).toBe(1)
    expect(findTrackIndex(album, { bvid: 'BV1' })).toBe(-1)
  })

  it('matches a resolved cid back onto an unresolved queue row', () => {
    expect(findTrackIndex([{ bvid: 'BV1' }], { bvid: 'BV1', cid: 9 })).toBe(0)
  })
})

describe('sameTrack', () => {
  it('does not treat different pages as the same track', () => {
    expect(sameTrack({ bvid: 'BV1', cid: 1 }, { bvid: 'BV1', cid: 2 })).toBe(false)
    expect(sameTrack({ bvid: 'BV1', cid: 2 }, { bvid: 'BV1', cid: 2 })).toBe(true)
  })
})
