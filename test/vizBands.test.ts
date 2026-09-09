import { describe, expect, it } from 'vitest'
import { bandsFromSpectrum } from '~/shared/vizBands'

describe('bandsFromSpectrum', () => {
  it('returns zeros for empty data', () => {
    expect(bandsFromSpectrum([])).toEqual({ bass: 0, mid: 0, high: 0 })
  })

  it('reads bass from the low bins', () => {
    const data = new Uint8Array(64)
    data.fill(10)
    data[2] = 200
    data[3] = 200
    const bands = bandsFromSpectrum(data)
    expect(bands.bass).toBeGreaterThan(bands.mid)
    expect(bands.bass).toBeGreaterThan(bands.high)
    expect(bands.bass).toBeLessThanOrEqual(1)
  })
})
