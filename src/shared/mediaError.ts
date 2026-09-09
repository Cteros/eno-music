export function isRetryableLoadError(err: unknown) {
  const text = String(err)
  return text === '4'
    || text === '3'
    || text.endsWith(': 4')
    || text.endsWith('：4')
    || text.endsWith(': 3')
    || text.includes('加载失败: 4')
    || text.includes('加载失败：4')
    || text.includes('播放失败: 4')
    || text.includes('播放失败：4')
    || text.includes('MEDIA_ERR_SRC_NOT_SUPPORTED')
    || text.includes('MEDIA_ERR_DECODE')
    || text.includes('加载超时')
    || text.includes('音轨下载失败')
    || text.includes('Decoding audio data failed')
}

export function isExpectedPlaybackError(err: unknown) {
  const text = String(err)
  return isRetryableLoadError(err)
    || text.includes('没有可用音轨')
    || text.includes('可能需要登录')
    || text.includes('解析音轨失败')
}
