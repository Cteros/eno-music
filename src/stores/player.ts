import { defineStore } from 'pinia'
import { cloneDeep } from 'lodash'
import { useStorage } from '@vueuse/core'
import type { Song } from './types'

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
      const isInList = this.playList.some(item => item?.id === song.id)
      if (!isInList)
        this.playList.push(song)
    },
  },
})
