export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, ms))
  })
}

export async function withRetry<T>(
  task: () => Promise<T>,
  options?: {
    tries?: number
    delayMs?: number
    factor?: number
  },
): Promise<T> {
  const tries = Math.max(1, options?.tries ?? 4)
  const delayMs = options?.delayMs ?? 400
  const factor = options?.factor ?? 2
  let lastError: unknown
  for (let i = 0; i < tries; i++) {
    try {
      return await task()
    }
    catch (error) {
      lastError = error
      if (i >= tries - 1)
        break
      await wait(Math.round(delayMs * (factor ** i)))
    }
  }
  throw lastError
}
