import type { Song } from './types'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { songKey, stripHtml } from '~/shared/playerBridge'

const MAX_PLAY = 40
const MAX_SEARCH = 12

function compactSong(song: Song): Song {
  return {
    id: song.id,
    bvid: song.bvid,
    cid: song.cid,
    eno_song_type: song.eno_song_type || (song.cid ? 'cid' : 'bvid'),
    cover: song.cover,
    title: stripHtml(String(song.title || '')),
    author: song.author,
    duration: song.duration,
    mid: song.mid,
  }
}

export const useRecentStore = defineStore('recent', {
  state: () => ({
    playHistory: useLocalStorage('playHistory', [] as Song[]),
    searchHistory: useLocalStorage('searchHistory', [] as string[]),
  }),
  actions: {
    recordPlay(song: Song) {
      if (!song?.id && !song?.bvid)
        return
      const next = compactSong(song)
      const key = songKey(next)
      if (!key)
        return
      this.playHistory = [
        next,
        ...this.playHistory.filter(item => songKey(item) !== key),
      ].slice(0, MAX_PLAY)
    },
    clearPlay() {
      this.playHistory = []
    },
    removePlay(song: Song) {
      const key = songKey(song)
      if (!key)
        return
      this.playHistory = this.playHistory.filter(item => songKey(item) !== key)
    },
    recordSearch(keyword: string) {
      const query = keyword.trim()
      if (!query)
        return
      this.searchHistory = [
        query,
        ...this.searchHistory.filter(item => item !== query),
      ].slice(0, MAX_SEARCH)
    },
    removeSearch(keyword: string) {
      this.searchHistory = this.searchHistory.filter(item => item !== keyword)
    },
    clearSearch() {
      this.searchHistory = []
    },
  },
})
