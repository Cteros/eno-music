export const PLAYER_CMD = 'ENO_PLAYER_CMD'
export const PLAYER_STATE_KEY = 'enoPopupPlayer'
export const PLAYER_PENDING_CMD_KEY = 'enoPendingPlayerCmd'

export type PlayerRemoteCmd = 'toggle' | 'prev' | 'next' | 'play' | 'pause'

export interface PlayerPopupState {
  title: string
  author: string
  cover: string
  isPlaying: boolean
  hasSong: boolean
  current: number
  total: number
  updatedAt: number
}

export interface PlayerCmdMessage {
  type: typeof PLAYER_CMD
  cmd: PlayerRemoteCmd
}

export function emptyPlayerPopupState(): PlayerPopupState {
  return {
    title: '暂无歌曲',
    author: '',
    cover: '',
    isPlaying: false,
    hasSong: false,
    current: 0,
    total: 0,
    updatedAt: Date.now(),
  }
}

export function stripHtml(input = '') {
  return input.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export function formatPlayerTime(seconds = 0) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
