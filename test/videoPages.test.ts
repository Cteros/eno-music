import { describe, expect, it } from 'vitest'
import { songKey } from '~/shared/playerBridge'
import { expandVideoPages, pageCount, pageToTrack } from '~/shared/videoPages'

describe('pageCount', () => {
  it('reads array length or numeric search field', () => {
    expect(pageCount([{ cid: 1 }, { cid: 2 }])).toBe(2)
    expect(pageCount(4)).toBe(4)
    expect(pageCount(undefined)).toBe(0)
  })
})

describe('expandVideoPages', () => {
  const video = {
    id: 'BV1xx',
    bvid: 'BV1xx',
    title: '专辑名',
    author: 'UP',
    cover: 'https://cover',
    eno_song_type: 'bvid',
  }

  it('keeps a single page as one track', () => {
    const tracks = expandVideoPages(video, [{ cid: 11, part: 'only', duration: 90 }])
    expect(tracks).toHaveLength(1)
    expect(tracks[0].bvid).toBe('BV1xx')
    expect(tracks[0].cid).toBe(11)
  })

  it('expands multi page into cid tracks', () => {
    const tracks = expandVideoPages(video, [
      { cid: 11, page: 1, part: '前奏', duration: 10, first_frame: 'https://a' },
      { cid: 22, page: 2, part: '副歌', duration: 20 },
    ])
    expect(tracks).toHaveLength(2)
    expect(tracks[0]).toMatchObject({
      id: 11,
      cid: 11,
      eno_song_type: 'cid',
      title: '前奏',
      album: '专辑名',
      cover: 'https://a',
    })
    expect(tracks[1].title).toBe('副歌')
    expect(tracks[1].cover).toBe('https://cover')
    expect(songKey(tracks[0])).not.toBe(songKey(tracks[1]))
  })
})

describe('pageToTrack', () => {
  it('falls back to album P-index when part is empty', () => {
    const track = pageToTrack({ cid: 9, page: 3 }, { bvid: 'BV1', title: '合集' }, 2)
    expect(track.title).toBe('合集 P3')
  })
})
