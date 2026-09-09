import { describe, expect, it } from 'vitest'
import {
  CROSSFADE_MS,
  crossfadeDurationMs,
  shouldOverlapBeforeEnd,
  shouldPrimeNext,
} from '~/shared/crossfade'

describe('crossfadeDurationMs', () => {
  it('fades 800ms when the current track still has time', () => {
    expect(crossfadeDurationMs({
      enabled: true,
      hasOutgoing: true,
      outgoingPlaying: true,
      volume: 1,
      remainingMs: 120_000,
    })).toBe(CROSSFADE_MS)
  })

  it('shortens when the current track is almost over', () => {
    expect(crossfadeDurationMs({
      enabled: true,
      hasOutgoing: true,
      outgoingPlaying: true,
      volume: 1,
      remainingMs: 240,
    })).toBe(240)
  })

  it('skips when disabled, silent, or the same track', () => {
    const base = {
      hasOutgoing: true,
      outgoingPlaying: true,
      volume: 1,
    }
    expect(crossfadeDurationMs({ ...base, enabled: false })).toBe(0)
    expect(crossfadeDurationMs({ ...base, enabled: true, sameTrack: true })).toBe(0)
    expect(crossfadeDurationMs({ ...base, enabled: true, volume: 0 })).toBe(0)
    expect(crossfadeDurationMs({ ...base, enabled: true, outgoingPlaying: false })).toBe(0)
  })
})

describe('shouldOverlapBeforeEnd', () => {
  it('arms near the end of a long track', () => {
    expect(shouldOverlapBeforeEnd({
      enabled: true,
      playing: true,
      loopMode: 'list',
      sleepAfterCurrent: false,
      locked: false,
      hasNext: true,
      current: 179.3,
      total: 180,
    })).toBe(true)
  })

  it('does not steal single-loop or sleep-after-current', () => {
    const base = {
      enabled: true,
      playing: true,
      sleepAfterCurrent: false,
      locked: false,
      hasNext: true,
      current: 179.3,
      total: 180,
      loopMode: 'list',
    }
    expect(shouldOverlapBeforeEnd({ ...base, loopMode: 'single' })).toBe(false)
    expect(shouldOverlapBeforeEnd({ ...base, sleepAfterCurrent: true })).toBe(false)
    expect(shouldOverlapBeforeEnd({ ...base, locked: true })).toBe(false)
  })
})

describe('shouldPrimeNext', () => {
  it('prefetches in the last 8 seconds', () => {
    expect(shouldPrimeNext({
      enabled: true,
      playing: true,
      loopMode: 'list',
      sleepAfterCurrent: false,
      locked: false,
      primed: false,
      hasNext: true,
      current: 173,
      total: 180,
    })).toBe(true)
    expect(shouldPrimeNext({
      enabled: true,
      playing: true,
      loopMode: 'list',
      sleepAfterCurrent: false,
      locked: false,
      primed: true,
      hasNext: true,
      current: 173,
      total: 180,
    })).toBe(false)
  })
})
