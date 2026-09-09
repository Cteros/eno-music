import { stripHtml } from './playerBridge'

export interface VideoPage {
  cid?: string | number
  page?: number
  part?: string
  duration?: number
  first_frame?: string
}

export function pageCount(pages: unknown) {
  if (Array.isArray(pages))
    return pages.length
  const n = Number(pages)
  return Number.isFinite(n) ? n : 0
}

export function pageToTrack(page: VideoPage, video: Record<string, any>, index = 0) {
  const cid = page.cid
  const part = stripHtml(String(page.part || ''))
  const album = stripHtml(String(video.title || ''))
  return {
    id: cid,
    eno_song_type: 'cid' as const,
    cid,
    page: page.page || index + 1,
    bvid: video.bvid,
    aid: video.aid || video.id,
    cover: page.first_frame || video.cover || video.pic,
    title: part || `${album} P${page.page || index + 1}`,
    album,
    author: video.author || video.owner?.name || '未知',
    duration: page.duration || video.duration,
    mid: video.mid || video.owner?.mid,
    description: album,
  }
}

export function expandVideoPages(video: Record<string, any>, pages: VideoPage[] = []) {
  if (!Array.isArray(pages) || pages.length <= 1) {
    const cid = pages[0]?.cid || video.cid
    return [{
      ...video,
      id: video.id || video.bvid,
      eno_song_type: cid ? 'cid' : (video.eno_song_type || 'bvid'),
      cid,
    }]
  }
  return pages.map((page, index) => pageToTrack(page, video, index))
}
