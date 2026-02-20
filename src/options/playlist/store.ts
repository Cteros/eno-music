import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'

import { useApiClient } from '~/composables/api'

const api = useApiClient()

export interface song {
  id: string | number
  [key: string]: any
}

interface playlist {
  id: string | number
  name: string
  songs: song[]
}

export const defaultSingers = [
  '337312411', // 翠花
  '1889545341', // 邓紫棋
  '210752', // 真栗
  '37754047', // 咻咻满
  '20473341', // 一直在吃的周梓琦
  '1839002753', // 鹿火
  '98573631', // 鹿小草
]

export const usePlaylistStore = defineStore({
  id: 'playlist',
  state: () => ({
    list: useLocalStorage('playlist', [] as playlist[]),
    listenLater: useLocalStorage('listenLater', [] as song[]),
    // 待添加的song
    songToAdd: null as song | null,
    // 添加窗口是否打开
    addSongDialog: false,
    // 歌手相关
    // 用户自定义歌手mid
    singers: useLocalStorage('singers', [...defaultSingers] as string[]),
    singerCardCache: useLocalStorage('singerCardCache', {} as Record<string, any>),
    // 当前选中的歌手
    currentSinger: null as string | null,
    // 打开合集
    openCollection: false,
    collectionInfo: {} as object,
    collectionSongs: [] as song[],
  }),
  actions: {
    startAddSong(song: song) {
      this.songToAdd = song
      this.addSongDialog = true
    },
    // 添加到稍后再听
    addToListenLater(song: song) {
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
    createPlaylist(name: string, songs: song[] = []) {
      const id = nanoid()
      this.list.push({ id, name, songs })
    },
    removePlaylist(playlistId: string | number) {
      const index = this.list.findIndex(p => p.id === playlistId)
      if (index === -1)
        return
      this.list.splice(index, 1)
    },
    // 获取歌手信息
    fetchSingerInfoList() {
      if (this.singers.length === 0) {
        this.singers = [...defaultSingers]
      }
      // 获取用户添加的歌手信息
      this.singers.forEach((mid) => {
        this.fetchSingerInfo(mid)
      })
      // // 获取推荐歌手信息
      // defaultSingers.forEach((mid) => {
      //   this.fetchSingerInfo(mid)
      // })
    },
    // 获取单个歌手信息
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
