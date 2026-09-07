import { onMounted } from 'vue'

export function useMediaSession(handlers: {
  prev: () => void
  next: () => void
  play?: () => void
  pause?: () => void
}) {
  function setMetadata(play: Record<string, any>) {
    if (!('mediaSession' in navigator))
      return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: play.title,
      artist: play.author,
      album: play.album,
      artwork: play.cover ? [{ src: play.cover, sizes: '512x512' }] : [],
    })
  }

  onMounted(() => {
    if (!('mediaSession' in navigator))
      return
    navigator.mediaSession.setActionHandler('previoustrack', () => handlers.prev())
    navigator.mediaSession.setActionHandler('nexttrack', () => handlers.next())
    if (handlers.play)
      navigator.mediaSession.setActionHandler('play', () => handlers.play?.())
    if (handlers.pause)
      navigator.mediaSession.setActionHandler('pause', () => handlers.pause?.())
  })

  return {
    setMetadata,
  }
}
