import type { Song } from './types'
import { useStorage } from '@vueuse/core'
import { cloneDeep } from 'lodash'
import { defineStore } from 'pinia'
import { songKey } from '~/shared/playerBridge'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    howl: null as any,
    eqService: null as any,
    play: useStorage('playInfo', {} as Song),
    playList: useStorage('playList', [] as Song[]),
    loopMode: useStorage('loopMode', 'list'),
  }),
  actions: {
    startPlay(item: Song) {
      const song = cloneDeep(item)
      this.play = song
      const key = songKey(song)
      const isInList = this.playList.some(item => songKey(item) === key)
      if (!isInList)
        this.playList.push(song)
    },
    playAlbum(tracks: Song[], startId?: string | number) {
      if (!tracks.length)
        return
      this.playList = cloneDeep(tracks)
      this.play = this.playList.find(item => item.id === startId) || this.playList[0]
    },
  },
})
