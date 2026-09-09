import { describe, expect, it } from 'vitest'
import { isExpectedPlaybackError, isRetryableLoadError } from '~/shared/mediaError'

describe('isRetryableLoadError', () => {
  it('treats howler media error 4 as retryable', () => {
    expect(isRetryableLoadError(new Error('加载失败: 4'))).toBe(true)
    expect(isRetryableLoadError(new Error('播放失败: 4'))).toBe(true)
    expect(isRetryableLoadError('Error: 加载失败: 4')).toBe(true)
  })
})

describe('isExpectedPlaybackError', () => {
  it('does not treat unexpected engine errors as playback errors', () => {
    expect(isExpectedPlaybackError(new Error('chrome.runtime 不可用'))).toBe(false)
    expect(isExpectedPlaybackError(new Error('没有可用音轨，可能需要登录'))).toBe(true)
  })
})
