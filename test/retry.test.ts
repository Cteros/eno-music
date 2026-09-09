import { describe, expect, it } from 'vitest'
import { withRetry } from '~/shared/retry'

describe('withRetry', () => {
  it('returns the first success', async () => {
    let n = 0
    await expect(withRetry(async () => {
      n += 1
      if (n < 3)
        throw new Error('flaky')
      return 'ok'
    }, { tries: 4, delayMs: 1 })).resolves.toBe('ok')
    expect(n).toBe(3)
  })

  it('throws the last error after exhausting tries', async () => {
    await expect(withRetry(async () => {
      throw new Error('still down')
    }, { tries: 3, delayMs: 1 })).rejects.toThrow('still down')
  })
})
