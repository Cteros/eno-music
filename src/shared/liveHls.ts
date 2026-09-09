export const LIVE_HLS_CONFIG = {
  enableWorker: false,
  lowLatencyMode: false,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 10,
  manifestLoadingMaxRetry: 4,
  manifestLoadingRetryDelay: 600,
  manifestLoadingMaxRetryTimeout: 6000,
  levelLoadingMaxRetry: 4,
  levelLoadingRetryDelay: 600,
  fragLoadingMaxRetry: 6,
  fragLoadingRetryDelay: 400,
  fragLoadingMaxRetryTimeout: 6000,
  xhrSetup(xhr: XMLHttpRequest) {
    xhr.withCredentials = false
  },
}

export function recoverLiveHls(
  hls: {
    startLoad: (startPosition?: number) => void
    recoverMediaError: () => void
  },
  data: { fatal?: boolean, type?: string } | undefined,
  budget: { n: number },
  max = 8,
) {
  if (!data?.fatal)
    return true
  budget.n += 1
  if (budget.n > max)
    return false
  if (data.type === 'networkError') {
    hls.startLoad()
    return true
  }
  if (data.type === 'mediaError') {
    hls.recoverMediaError()
    return true
  }
  return false
}
