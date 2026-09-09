import { describe, expect, it, vi } from 'vitest'
import { recoverLiveHls } from '~/shared/liveHls'

describe('recoverLiveHls', () => {
  it('recovers fatal network and media errors', () => {
    const hls = {
      startLoad: vi.fn(),
      recoverMediaError: vi.fn(),
    }
    const budget = { n: 0 }
    expect(recoverLiveHls(hls, { fatal: true, type: 'networkError' }, budget)).toBe(true)
    expect(hls.startLoad).toHaveBeenCalledTimes(1)
    expect(recoverLiveHls(hls, { fatal: true, type: 'mediaError' }, budget)).toBe(true)
    expect(hls.recoverMediaError).toHaveBeenCalledTimes(1)
  })

  it('gives up after the budget is spent', () => {
    const hls = {
      startLoad: vi.fn(),
      recoverMediaError: vi.fn(),
    }
    const budget = { n: 8 }
    expect(recoverLiveHls(hls, { fatal: true, type: 'networkError' }, budget, 8)).toBe(false)
    expect(hls.startLoad).not.toHaveBeenCalled()
  })
})
