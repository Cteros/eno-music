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
  cover?: string
}
