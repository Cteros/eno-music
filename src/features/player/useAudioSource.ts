import { useApiClient } from '~/api'
import { usePlayerStore } from '~/stores'

function getUpUrl(obj: any) {
  const url1 = obj.baseUrl || ''
  const url2 = obj.backup_url?.[0] || ''
  const url3 = obj.backup_url?.[1] || ''
  const urlList = [url1, url2, url3].filter((url: string) => !url.startsWith('https://xy'))
  return urlList[0] || url1
}

export function useAudioSource() {
  const store = usePlayerStore()
  const api = useApiClient()

  async function getBvidUrl(item: any) {
    const { cid } = await api.blbl.getVideoInfo({
      bvid: item.bvid,
    }).then(res => res.data)

    const dash = await api.blbl.getAudioOfVideo({
      cid,
      bvid: item.bvid,
    }).then(res => res.data.dash)

    return {
      ...item,
      url: getUpUrl(dash.audio[0]),
      video: getUpUrl(dash.video[0]),
      dash,
    }
  }

  async function getCidUrl(item: any) {
    const dash = await api.blbl.getAudioOfVideo({
      cid: item.cid,
      bvid: item.bvid,
    }).then(res => res.data.dash)

    return {
      ...item,
      url: getUpUrl(dash.audio[0]),
      video: getUpUrl(dash.video[0]),
      dash,
    }
  }

  async function getSidUrl(item: any) {
    const url = await api.blbl.getSong({
      sid: item.id,
    }).then(res => res.data.cdns[0])

    return {
      ...item,
      url,
    }
  }

  async function getPlayUrl(currentSong: any) {
    const play = currentSong.eno_song_type === 'bvid'
      ? await getBvidUrl(currentSong)
      : currentSong.eno_song_type === 'cid'
        ? await getCidUrl(currentSong)
        : await getSidUrl(currentSong)
    store.play = play
  }

  return {
    getPlayUrl,
  }
}
