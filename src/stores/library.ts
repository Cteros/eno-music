import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'
import type { Playlist, Song } from './types'

export type { Song, song } from './types'

export const useLibraryStore = defineStore('library', {
  state: () => ({
    list: useLocalStorage('playlist', [] as Playlist[]),
    listenLater: useLocalStorage('listenLater', [] as Song[]),
    songToAdd: null as Song | null,
    addSongDialog: false,
    openCollection: false,
    collectionInfo: {} as Record<string, any>,
    collectionSongs: [] as Song[],
  }),
  actions: {
    startAddSong(song: Song) {
      this.songToAdd = song
      this.addSongDialog = true
    },
    addToListenLater(song: Song) {
      this.listenLater.push(song)
    },
    addSong(playlistId: string | number) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      playlist.songs.push(this.songToAdd!)
    },
    addSongToListenLater() {
      this.listenLater.push(this.songToAdd!)
      this.addSongDialog = false
    },
    removeSong(playlistId: string | number, songId: string | number) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      const index = playlist.songs.findIndex(s => s.id === songId)
      if (index === -1)
        return
      playlist.songs.splice(index, 1)
    },
    createPlaylist(name: string, songs: Song[] = []) {
      const id = nanoid()
      this.list.push({ id, name, songs })
    },
    removePlaylist(playlistId: string | number) {
      const index = this.list.findIndex(p => p.id === playlistId)
      if (index === -1)
        return
      this.list.splice(index, 1)
    },
  },
})
