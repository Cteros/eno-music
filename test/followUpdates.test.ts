import { describe, expect, it } from 'vitest'
import { arcToFollowTrack, formatPubAgo, mergeFollowUpdates } from '~/shared/followUpdates'

describe('formatPubAgo', () => {
  it('uses relative time for recent posts', () => {
    const now = Date.UTC(2026, 8, 9, 12, 0, 0)
    expect(formatPubAgo(now / 1000 - 20, now)).toBe('刚刚')
    expect(formatPubAgo(now / 1000 - 10 * 60, now)).toBe('10 分钟前')
    expect(formatPubAgo(now / 1000 - 3 * 3600, now)).toBe('3 小时前')
    expect(formatPubAgo(now / 1000 - 2 * 86400, now)).toBe('2 天前')
  })
})

describe('arcToFollowTrack', () => {
  it('keeps pubdate for sorting', () => {
    const track = arcToFollowTrack({
      bvid: 'BV1',
      title: '新歌',
      author: 'UP',
      pic: '//i0.hdslb.com/a.jpg',
      length: '4:00',
      created: 1700000000,
    }, '123')
    expect(track).toMatchObject({
      bvid: 'BV1',
      mid: '123',
      created: 1700000000,
      cover: 'https://i0.hdslb.com/a.jpg',
    })
  })
})

describe('mergeFollowUpdates', () => {
  it('sorts by created and drops duplicate bvid', () => {
    const now = Date.UTC(2026, 8, 9, 12, 0, 0)
    const sec = Math.floor(now / 1000)
    const list = mergeFollowUpdates([
      [{
        id: 'a',
        bvid: 'BV1',
        title: '旧',
        author: 'A',
        cover: '',
        duration: 120,
        mid: '1',
        created: sec - 4000,
        eno_song_type: 'bvid',
        album: '关注更新',
      }],
      [{
        id: 'b',
        bvid: 'BV2',
        title: '新',
        author: 'B',
        cover: '',
        duration: 120,
        mid: '2',
        created: sec - 60,
        eno_song_type: 'bvid',
        album: '关注更新',
      }],
      [{
        id: 'dup',
        bvid: 'BV2',
        title: '重复',
        author: 'B',
        cover: '',
        duration: 120,
        mid: '2',
        created: sec - 90,
        eno_song_type: 'bvid',
        album: '关注更新',
      }],
    ], now)
    expect(list.map(item => item.bvid)).toEqual(['BV2', 'BV1'])
    expect(list[0].pubAgo).toBe('1 分钟前')
  })
})
