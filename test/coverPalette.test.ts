import { describe, expect, it } from 'vitest'
import { normalizeCoverUrl, paletteFromPixels } from '~/features/player/coverPalette'

describe('normalizeCoverUrl', () => {
  it('upgrades protocol-relative and http covers', () => {
    expect(normalizeCoverUrl('//i0.hdslb.com/a.jpg')).toBe('https://i0.hdslb.com/a.jpg')
    expect(normalizeCoverUrl('http://i0.hdslb.com/a.jpg')).toBe('https://i0.hdslb.com/a.jpg')
    expect(normalizeCoverUrl('https://i0.hdslb.com/a.jpg')).toBe('https://i0.hdslb.com/a.jpg')
  })
})

describe('paletteFromPixels', () => {
  it('picks a saturated accent over near-black pixels', () => {
    const data = new Uint8ClampedArray([
      0,
      0,
      0,
      255,
      40,
      200,
      90,
      255,
      255,
      255,
      255,
      255,
    ])
    const palette = paletteFromPixels(data)
    expect(palette.accent).toBe('rgb(40 200 90)')
    expect(palette.wash.startsWith('rgb(')).toBe(true)
    expect(palette.dim.startsWith('rgb(')).toBe(true)
  })
})
