import type { Playlist, Song } from './types'
import { useLocalStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { songKey } from '~/shared/playerBridge'

export type { Song, song } from './types'

export const useLibraryStore = defineStore('library', {
  state: () => ({
    list: useLocalStorage('playlist', [] as Playlist[]),
    listenLater: useLocalStorage('listenLater', [] as Song[]),
    songToAdd: null as Song | null,
    addSongDialog: false,
    openCollection: false,
    promptCreate: false,
    collectionInfo: {} as Record<string, any>,
    collectionSongs: [] as Song[],
  }),
  actions: {
    startAddSong(song: Song) {
      this.songToAdd = song
      this.addSongDialog = true
    },
    addToListenLater(song: Song) {
      const key = songKey(song)
      if (key && this.listenLater.some(item => songKey(item) === key))
        return false
      this.listenLater.push(song)
      return true
    },
    addSong(playlistId: string | number) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist || !this.songToAdd)
        return
      if (playlist.songs.some(s => s.id === this.songToAdd?.id))
        return
      playlist.songs.push(this.songToAdd)
      if (!playlist.cover && this.songToAdd.cover)
        playlist.cover = this.songToAdd.cover
    },
    addSongs(playlistId: string | number, songs: Song[]) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      for (const song of songs) {
        if (!playlist.songs.some(item => item.id === song.id))
          playlist.songs.push(song)
      }
      if (!playlist.cover)
        playlist.cover = songs.find(song => song.cover)?.cover
    },
    addSongToListenLater() {
      if (this.songToAdd)
        this.addToListenLater(this.songToAdd)
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
      this.list.push({
        id,
        name,
        songs,
        cover: songs.find(song => song.cover)?.cover,
      })
      return id
    },
    renamePlaylist(playlistId: string | number, name: string) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      playlist.name = name
    },
    setPlaylistCover(playlistId: string | number, cover: string) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      playlist.cover = cover
    },
    reorderPlaylists(from: number, to: number) {
      if (from === to || from < 0 || to < 0 || from >= this.list.length || to >= this.list.length)
        return
      const next = [...this.list]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      this.list = next
    },
    reorderSongs(playlistId: string | number, from: number, to: number) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      if (from === to || from < 0 || to < 0 || from >= playlist.songs.length || to >= playlist.songs.length)
        return
      const next = [...playlist.songs]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      playlist.songs = next
      if (!playlist.cover)
        playlist.cover = next.find(song => song.cover)?.cover
    },
    removePlaylist(playlistId: string | number) {
      const index = this.list.findIndex(p => p.id === playlistId)
      if (index === -1)
        return
      this.list.splice(index, 1)
    },
    dedupePlaylist(playlistId: string | number) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return 0
      const seen = new Set<string>()
      const next: Song[] = []
      for (const song of playlist.songs) {
        const key = songKey(song)
        if (key && seen.has(key))
          continue
        if (key)
          seen.add(key)
        next.push(song)
      }
      const removed = playlist.songs.length - next.length
      playlist.songs = next
      return removed
    },
    shufflePlaylist(playlistId: string | number) {
      const playlist = this.list.find(p => p.id === playlistId)
      if (!playlist)
        return
      const next = [...playlist.songs]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const swap = next[i]
        next[i] = next[j]
        next[j] = swap
      }
      playlist.songs = next
    },
  },
})
