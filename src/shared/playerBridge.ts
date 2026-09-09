import type { VizBands } from './vizBands'
import { sendExtMessage } from './chromeApi'

export const PLAYER_STATE_KEY = 'enoPopupPlayer'
export const PLAYER_SNAPSHOT_KEY = 'enoPlayerSnapshot'

export type PlayerRemoteCmd = 'toggle' | 'prev' | 'next' | 'play' | 'pause' | 'retry'

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const
export const LOOP_MODES = ['list', 'single', 'random'] as const

export type LoopMode = typeof LOOP_MODES[number]

export function nextPlaybackRate(current = 1) {
  const index = PLAYBACK_RATES.findIndex(rate => Math.abs(rate - current) < 0.01)
  return PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length]
}

export function formatPlaybackRate(rate = 1) {
  if (Math.abs(rate - 1) < 0.01)
    return '1×'
  const label = Number.isInteger(rate) ? String(rate) : String(rate)
  return `${label}×`
}

export function nextLoopMode(current = 'list'): LoopMode {
  const index = LOOP_MODES.indexOf(current as LoopMode)
  const from = index < 0 ? 0 : index
  return LOOP_MODES[(from + 1) % LOOP_MODES.length]
}

export function loopModeLabel(mode = 'list') {
  if (mode === 'single')
    return '单曲循环'
  if (mode === 'random')
    return '随机播放'
  return '列表循环'
}

export type PlayerMessageType
  = | 'ENO_PLAYER_CMD'
    | 'ENO_PLAYER_PLAY'
    | 'ENO_PLAYER_SEEK'
    | 'ENO_PLAYER_VOLUME'
    | 'ENO_PLAYER_SET_LOOP'
    | 'ENO_PLAYER_SET_PLAYLIST'
    | 'ENO_PLAYER_SET_EQ'
    | 'ENO_PLAYER_SET_RATE'
    | 'ENO_PLAYER_SET_SLEEP'
    | 'ENO_PLAYER_SET_CROSSFADE'
    | 'ENO_PLAYER_SET_LIVE_PICTURE'
    | 'ENO_LIVE_MIRROR_START'
    | 'ENO_LIVE_MIRROR_STOP'
    | 'ENO_LIVE_MIRROR_SIGNAL'
    | 'ENO_PLAYER_GET_STATE'
    | 'ENO_PLAYER_STATE'
    | 'ENO_VIZ'
    | 'ENO_RESOLVE_URL'
    | 'ENO_STORAGE_GET'
    | 'ENO_STORAGE_SET'

export interface PlayerPopupState {
  id?: string | number
  bvid?: string
  cid?: string | number
  title: string
  author: string
  cover: string
  video?: string
  isPlaying: boolean
  hasSong: boolean
  current: number
  total: number
  volume: number
  loopMode: string
  rate: number
  sleepUntil: number
  sleepAfterCurrent: boolean
  crossfade?: boolean
  live?: boolean
  error?: string
  updatedAt: number
}

export interface PlayerSongPayload {
  id?: string | number
  title?: string
  author?: string
  cover?: string
  bvid?: string
  cid?: string | number
  eno_song_type?: string
  url?: string
  video?: string
  [key: string]: any
}

export interface LiveMirrorSignal {
  kind: 'offer' | 'answer' | 'ice'
  sdp?: string
  candidate?: RTCIceCandidateInit | null
}

export interface PlayerEnvelope {
  target: 'background' | 'offscreen' | 'ui'
  type: PlayerMessageType
  cmd?: PlayerRemoteCmd
  song?: PlayerSongPayload
  playList?: PlayerSongPayload[]
  loopMode?: string
  volume?: number
  seekTo?: number
  seekRatio?: number
  eqValues?: number[]
  rate?: number
  sleepMinutes?: number
  sleepAfterCurrent?: boolean
  crossfade?: boolean
  livePicture?: boolean
  signal?: LiveMirrorSignal
  state?: PlayerPopupState
  keys?: string | string[] | Record<string, unknown> | null
  items?: Record<string, unknown>
  viz?: VizBands
}

export interface PlayerMessageResult {
  ok: boolean
  state?: PlayerPopupState
  error?: string
  song?: PlayerSongPayload
  data?: Record<string, unknown>
}

export function emptyPlayerPopupState(): PlayerPopupState {
  return {
    title: '暂无歌曲',
    author: '',
    cover: '',
    video: '',
    cid: undefined,
    isPlaying: false,
    hasSong: false,
    current: 0,
    total: 0,
    volume: 1,
    loopMode: 'list',
    rate: 1,
    sleepUntil: 0,
    sleepAfterCurrent: false,
    crossfade: true,
    live: false,
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

export function songKey(song?: { id?: string | number, bvid?: string, cid?: string | number, eno_song_type?: string, roomid?: string | number } | null) {
  if (!song)
    return ''
  if (song.eno_song_type === 'live')
    return `live:${song.roomid || song.id || ''}`
  if (song.cid != null && song.cid !== '')
    return `cid:${song.bvid || ''}:${song.cid}`
  if (song.id != null && song.id !== '')
    return `id:${song.id}`
  if (song.bvid)
    return `bvid:${song.bvid}`
  return ''
}

export function findTrackIndex(
  list: Array<{ id?: string | number, bvid?: string, cid?: string | number }> | undefined,
  song?: { id?: string | number, bvid?: string, cid?: string | number } | null,
) {
  if (!song || !list?.length)
    return -1
  const key = songKey(song)
  if (key) {
    const exact = list.findIndex(item => songKey(item) === key)
    if (exact >= 0)
      return exact
  }
  if (song.cid != null && song.cid !== '') {
    const byCid = list.findIndex(item => item.cid != null && item.cid !== '' && String(item.cid) === String(song.cid))
    if (byCid >= 0)
      return byCid
  }
  if (song.bvid && (song.cid == null || song.cid === '')) {
    return list.findIndex(item => item.bvid === song.bvid && (item.cid == null || item.cid === ''))
  }
  if (song.bvid && song.cid != null && song.cid !== '') {
    return list.findIndex(item => item.bvid === song.bvid && (item.cid == null || item.cid === ''))
  }
  return -1
}

export function sameTrack(
  a?: { id?: string | number, bvid?: string, cid?: string | number } | null,
  b?: { id?: string | number, bvid?: string, cid?: string | number } | null,
) {
  if (!a || !b)
    return false
  return findTrackIndex([b], a) === 0
}

export async function sendPlayerMessage(message: Omit<PlayerEnvelope, 'target'>): Promise<PlayerMessageResult> {
  const result = await Promise.race([
    sendExtMessage({
      target: 'background',
      ...message,
    }) as Promise<PlayerMessageResult>,
    new Promise<PlayerMessageResult>(resolve =>
      setTimeout(resolve, 12000, { ok: false, error: '播放器超时' }),
    ),
  ])
  return result || { ok: false, error: '播放器无响应' }
}
