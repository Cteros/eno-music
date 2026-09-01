export interface Song {
  id: string | number
  [key: string]: any
}

/** @deprecated 使用 Song */
export type song = Song

export interface Playlist {
  id: string | number
  name: string
  songs: Song[]
}

export const VIDEO_MODE = {
  FLOATING: 'floating',
  DRAWER: 'drawer',
  HIDDEN: 'hidden',
} as const

export type VideoMode = typeof VIDEO_MODE[keyof typeof VIDEO_MODE]
