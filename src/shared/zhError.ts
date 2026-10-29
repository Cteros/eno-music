const NETWORK_PATTERN = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|timed out|econn|socket|aborted/i

/**
 * 把底层错误翻译成中文问题句：网络类错误给统一说法，
 * 已经是中文的业务错误保留原文，其余交给调用点的中文兜底。
 */
export function zhError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    if (/[\u4E00-\u9FFF]/.test(error.message))
      return error.message
    if (NETWORK_PATTERN.test(error.message))
      return '网络没通，请稍后重试'
  }
  return fallback
}
