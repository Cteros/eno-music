import { describe, expect, it } from 'vitest'
import {
  arcToRadioTrack,
  buildHourlyRadio,
  parseClockDuration,
} from '~/shared/hourlyRadio'

describe('parseClockDuration', () => {
  it('reads mm:ss and seconds', () => {
    expect(parseClockDuration('3:45')).toBe(225)
    expect(parseClockDuration('1:02:03')).toBe(3723)
    expect(parseClockDuration(180)).toBe(180)
  })
})

describe('arcToRadioTrack', () => {
  it('prefers length over missing duration', () => {
    const track = arcToRadioTrack({
      bvid: 'BV1',
      title: '歌',
      author: 'UP',
      pic: '//i0.hdslb.com/a.jpg',
      length: '4:00',
    }, '123')
    expect(track?.cover).toBe('https://i0.hdslb.com/a.jpg')
    expect(track?.duration).toBe(240)
  })
})

describe('buildHourlyRadio', () => {
  it('round-robins UPs into a 45–60 minute set', () => {
    const make = (mid: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `${mid}-${i}`,
        bvid: `${mid}-${i}`,
        title: `${mid}-${i}`,
        author: mid,
        cover: '',
        duration: 180,
        mid,
        eno_song_type: 'bvid' as const,
        album: '关注电台',
      }))

    const set = buildHourlyRadio([make('a', 20), make('b', 20), make('c', 20)], {
      seed: 20260909,
    })
    const total = set.reduce((sum, track) => sum + track.duration, 0)
    expect(total).toBeGreaterThanOrEqual(45 * 60)
    expect(total).toBeLessThanOrEqual(60 * 60)
    const authors = set.map(track => track.author)
    expect(new Set(authors).size).toBeGreaterThan(1)
    expect(authors.filter(name => name === 'a').length).toBeLessThan(set.length)
  })

  it('drops tracks that are too long', () => {
    const set = buildHourlyRadio([[
      {
        id: 'long',
        bvid: 'BVL',
        title: 'live',
        author: 'a',
        cover: '',
        duration: 40 * 60,
        mid: 'a',
        eno_song_type: 'bvid',
        album: '关注电台',
      },
      {
        id: 'ok',
        bvid: 'BVO',
        title: 'song',
        author: 'a',
        cover: '',
        duration: 200,
        mid: 'a',
        eno_song_type: 'bvid',
        album: '关注电台',
      },
    ]], { minSec: 180, maxSec: 400, seed: 1 })
    expect(set.map(track => track.bvid)).toEqual(['BVO'])
  })
})
