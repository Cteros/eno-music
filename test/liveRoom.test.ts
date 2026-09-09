import { describe, expect, it } from 'vitest'
import { areaItemToLiveTrack, collectLiveHlsUrls, pickLiveHlsUrl, roomToLiveTrack } from '~/shared/liveRoom'

describe('pickLiveHlsUrl', () => {
  it('prefers http_hls fmp4 over flv', () => {
    const url = pickLiveHlsUrl({
      data: {
        playurl_info: {
          playurl: {
            stream: [
              {
                protocol_name: 'http_stream',
                format: [{
                  format_name: 'flv',
                  codec: [{ base_url: '/flv', url_info: [{ host: 'https://a', extra: '' }] }],
                }],
              },
              {
                protocol_name: 'http_hls',
                format: [
                  {
                    format_name: 'ts',
                    codec: [{ base_url: '/ts.m3u8', url_info: [{ host: 'https://b.com', extra: '?t=1' }] }],
                  },
                  {
                    format_name: 'fmp4',
                    codec: [{ base_url: '/index.m3u8', url_info: [{ host: 'https://c.com', extra: '?t=2' }] }],
                  },
                ],
              },
            ],
          },
        },
      },
    })
    expect(url).toBe('https://c.com/index.m3u8?t=2')
  })

  it('keeps backup hosts for retry', () => {
    expect(collectLiveHlsUrls({
      data: {
        playurl_info: {
          playurl: {
            stream: [{
              protocol_name: 'http_hls',
              format: [{
                format_name: 'fmp4',
                codec: [{
                  base_url: '/index.m3u8',
                  url_info: [
                    { host: 'https://a.com', extra: '?t=1' },
                    { host: 'https://b.com', extra: '?t=2' },
                  ],
                }],
              }],
            }],
          },
        },
      },
    })).toEqual([
      'https://a.com/index.m3u8?t=1',
      'https://b.com/index.m3u8?t=2',
    ])
  })
})

describe('roomToLiveTrack', () => {
  it('only keeps rooms that are actually live', () => {
    expect(roomToLiveTrack('1', 'UP', { liveStatus: 0, roomid: 9 })).toBeNull()
    expect(roomToLiveTrack('1', 'UP', {
      liveStatus: 1,
      roomid: 88,
      title: '在唱',
      cover: '//i0.hdslb.com/a.jpg',
    })).toMatchObject({
      id: 'live:88',
      eno_song_type: 'live',
      author: 'UP',
      cover: 'https://i0.hdslb.com/a.jpg',
    })
  })
})

describe('areaItemToLiveTrack', () => {
  it('maps a music-area live card', () => {
    expect(areaItemToLiveTrack({
      roomid: 22,
      title: '在唱',
      uname: 'UP',
      uid: 9,
      cover: '//i0.hdslb.com/a.jpg',
      area_name: '唱见电台',
    })).toMatchObject({
      id: 'live:22',
      eno_song_type: 'live',
      author: 'UP',
      album: '唱见电台',
      cover: 'https://i0.hdslb.com/a.jpg',
    })
  })
})
