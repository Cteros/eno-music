import { describe, expect, it } from 'vitest'
import {
  createStateOrder,
  findTrackIndex,
  formatPlaybackRate,
  formatPlayerTime,
  loopModeLabel,
  nextLoopMode,
  nextPlaybackRate,
  sameTrack,
  songKey,
  trackMatches,
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
    expect(songKey({ eno_song_type: 'live', id: 'live:88' })).toBe('live:88')
    expect(songKey({ eno_song_type: 'live', roomid: 88, id: 'live:88' })).toBe('live:88')
  })

  it('keys remote live state the same as the local queue row', () => {
    const row = { eno_song_type: 'live', roomid: 88, id: 88, title: '直播' }
    // 引擎状态会把 roomid/id 平铺到 PlayerPopupState 上
    const remote = { eno_song_type: 'live', roomid: 88, id: 88 }
    expect(songKey(remote)).toBe(songKey(row))
  })
})

describe('createStateOrder', () => {
  it('drops out-of-order states within the same engine session', () => {
    const accept = createStateOrder()
    expect(accept({ updatedAt: 2, session: 'a', seq: 2 } as any)).toBe(true)
    expect(accept({ updatedAt: 3, session: 'a', seq: 3 } as any)).toBe(true)
    expect(accept({ updatedAt: 1, session: 'a', seq: 1 } as any)).toBe(false)
  })

  it('accepts a fresh session after the engine restarts', () => {
    const accept = createStateOrder()
    expect(accept({ updatedAt: 2, session: 'a', seq: 5 } as any)).toBe(true)
    expect(accept({ updatedAt: 1, session: 'b', seq: 1 } as any)).toBe(true)
    expect(accept({ updatedAt: 1, session: 'b', seq: 2 } as any)).toBe(true)
    expect(accept({ updatedAt: 1, session: 'b', seq: 1 } as any)).toBe(false)
  })

  it('falls back to updatedAt when seq is missing', () => {
    const accept = createStateOrder()
    expect(accept({ updatedAt: 100 } as any)).toBe(true)
    expect(accept({ updatedAt: 90 } as any)).toBe(false)
    expect(accept({ updatedAt: 110 } as any)).toBe(true)
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

describe('trackMatches', () => {
  it('treats an unresolved bvid row and its resolved cid state as the same track', () => {
    // 点歌时 store 是 bvid:BV1，引擎解析后状态是 cid:BV1:9
    expect(trackMatches({ bvid: 'BV1' }, { bvid: 'BV1', cid: 9 })).toBe(true)
    expect(trackMatches({ bvid: 'BV1', cid: 9 }, { bvid: 'BV1' })).toBe(true)
  })

  it('still rejects different pages of the same BV', () => {
    expect(trackMatches({ bvid: 'BV1', cid: 1 }, { bvid: 'BV1', cid: 2 })).toBe(false)
    expect(trackMatches({ bvid: 'BV1', cid: 1 }, { bvid: 'BV2', cid: 1 })).toBe(false)
  })

  it('matches live rooms by room id', () => {
    expect(trackMatches({ eno_song_type: 'live', roomid: 88 }, { eno_song_type: 'live', id: 'live:88' })).toBe(true)
    expect(trackMatches({ eno_song_type: 'live', roomid: 88 }, { eno_song_type: 'live', roomid: 89 })).toBe(false)
    expect(trackMatches({ eno_song_type: 'live', roomid: 88 }, { bvid: 'BV1', cid: 1 })).toBe(false)
  })

  it('matches plain rows by id when no bvid is present', () => {
    expect(trackMatches({ id: 5 }, { id: 5 })).toBe(true)
    expect(trackMatches({ id: 5 }, { id: 6 })).toBe(false)
    expect(trackMatches({ id: 5 }, { bvid: 'BV1' })).toBe(false)
  })
})
