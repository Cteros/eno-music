import { describe, expect, it } from 'vitest'
import {
  formatPlaybackRate,
  formatPlayerTime,
  loopModeLabel,
  nextLoopMode,
  nextPlaybackRate,
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
