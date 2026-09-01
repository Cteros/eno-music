import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useApiClient } from '~/api'

const api = useApiClient()

export const defaultSingers = [
  '337312411', // 翠花
  '1889545341', // 邓紫棋
  '210752', // 真栗
  '37754047', // 咻咻满
  '20473341', // 一直在吃的周梓琦
  '1839002753', // 鹿火
  '98573631', // 鹿小草
]

export const useSingerStore = defineStore('singer', {
  state: () => ({
    singers: useLocalStorage('singers', [...defaultSingers] as string[]),
    singerCardCache: useLocalStorage('singerCardCache', {} as Record<string, any>),
    currentSinger: null as string | null,
  }),
  actions: {
    fetchSingerInfoList() {
      if (this.singers.length === 0)
        this.singers = [...defaultSingers]

      this.singers.forEach((mid) => {
        this.fetchSingerInfo(mid)
      })
    },
    fetchSingerInfo(mid: string, withCache = true) {
      if (this.singerCardCache[mid] && withCache)
        return
      this.singerCardCache[mid] = null
      api.blbl.getUserInfo({ mid }).then((res) => {
        this.singerCardCache[mid] = res.data.card
      })
    },
    addSinger(mid: string) {
      this.singers.push(mid)
      this.fetchSingerInfo(mid, false)
    },
    removeSinger(mid: string) {
      const index = this.singers.findIndex(s => s === mid)
      if (index === -1)
        return
      this.singers.splice(index, 1)
    },
  },
})
