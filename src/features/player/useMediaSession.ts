import { onMounted } from 'vue'

export function useMediaSession(handlers: {
  prev: () => void
  next: () => void
}) {
  function setMetadata(play: Record<string, any>) {
    if (!('mediaSession' in navigator))
      return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: play.title,
      artist: play.author,
      album: play.album,
      artwork: [{ src: play.cover || '' }],
    })
  }

  onMounted(() => {
    if (!('mediaSession' in navigator))
      return
    navigator.mediaSession.setActionHandler('previoustrack', () => handlers.prev())
    navigator.mediaSession.setActionHandler('nexttrack', () => handlers.next())
  })

  return {
    setMetadata,
  }
}
