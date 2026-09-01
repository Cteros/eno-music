import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Song } from './types'
import { useApiClient } from '~/api'

const api = useApiClient()

interface MusicRankItem {
  creation_bvid: string
  mv_cover: string
  album: string
  description: string
  singer: string
  duration: number
}

export const useHomeStore = defineStore('home', {
  state: () => ({
    ranksId: [] as any[],
    musicRankList: useStorage('musicRankList', [] as Song[]),
  }),
  actions: {
    initHomePage() {
      this.initBiliMusic()
    },
    initBiliMusic() {
      api.biliMusic.getMusicRankList().then((res) => {
        const rankObj = res.data.list
        let flatList: any[] = []
        Object.values(rankObj).forEach((i) => {
          flatList = flatList.concat(i)
        })
        this.ranksId = flatList.sort((a, b) => b.ID - a.ID)
        this.getRankById(this.ranksId[0]?.ID)
      })
    },
    getRankById(id: number) {
      if (!id)
        return
      api.biliMusic.getMusicRank({
        list_id: id,
      }).then((res) => {
        const { data: { list } } = res as { data: { list: MusicRankItem[] } }
        if (Array.isArray(list) && list.length > 0) {
          this.musicRankList = res.data.list.map((item: MusicRankItem) => {
            return {
              id: item.creation_bvid,
              eno_song_type: 'bvid',
              cover: item.mv_cover,
              title: item.album,
              description: item.description || '',
              author: item.singer,
              duration: item.duration || 0,
              bvid: item.creation_bvid,
            }
          })
        }
      })
    },
  },
})
