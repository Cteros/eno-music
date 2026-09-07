import { describe, expect, it } from 'vitest'
import { collectAudioUrls, pickAudioUrl } from '~/shared/resolvePlayUrl'

describe('collectAudioUrls', () => {
  it('skips xy CDN and keeps backup urls', () => {
    expect(collectAudioUrls({
      audio: [
        {
          baseUrl: 'https://xy.example/a.m4s',
          backup_url: [
            'https://upos.example/a.m4s',
            'https://upos.example/a-b.m4s',
          ],
        },
        {
          baseUrl: 'https://upos.example/b.m4s',
        },
      ],
    })).toEqual([
      'https://upos.example/a.m4s',
      'https://upos.example/a-b.m4s',
      'https://upos.example/b.m4s',
    ])
  })

  it('returns empty when dash has no audio', () => {
    expect(collectAudioUrls(undefined)).toEqual([])
    expect(collectAudioUrls({})).toEqual([])
  })
})

describe('pickAudioUrl', () => {
  it('skips already failed addresses', () => {
    expect(pickAudioUrl(
      ['https://a.example/1', 'https://a.example/2'],
      ['https://a.example/1'],
    )).toBe('https://a.example/2')
  })

  it('returns empty when every candidate was skipped', () => {
    expect(pickAudioUrl(['https://a.example/1'], ['https://a.example/1'])).toBe('')
  })
})
