import { defineStore } from 'pinia'
import { stripHtml } from '~/shared/playerBridge'
import { useLibraryStore } from './library'
import { useSingerStore } from './singer'

export type AppView
  = | 'home'
    | 'search'
    | 'playlist'
    | 'listenLater'
    | 'recent'
    | 'singerList'
    | 'singerDetail'
    | 'setting'
    | 'about'

export interface NavFrame {
  mode: AppView
  playlistId: string | number | null
}

const VIEW_TITLE: Record<AppView, string> = {
  home: '首页',
  search: '搜索',
  playlist: '媒体库',
  listenLater: '稍后播放',
  recent: '最近播放',
  singerList: '关注的音乐人',
  singerDetail: '艺人',
  setting: '设置',
  about: '关于',
}

function sameFrame(a: NavFrame, b: NavFrame) {
  return a.mode === b.mode && String(a.playlistId ?? '') === String(b.playlistId ?? '')
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    mode: 'home' as AppView,
    playlistId: null as string | number | null,
    history: [] as NavFrame[],
    showVideo: false,
  }),
  getters: {
    canBack: s => s.history.length > 0,
    pageTitle: (s) => {
      if (s.mode === 'playlist' && s.playlistId != null) {
        const playlist = useLibraryStore().list.find(item => String(item.id) === String(s.playlistId))
        return stripHtml(String(playlist?.name || '歌单'))
      }
      if (s.mode === 'singerDetail') {
        const singer = useSingerStore()
        const mid = singer.currentSinger
        if (mid)
          return singer.singerCardCache[mid]?.name || '艺人'
        return '艺人'
      }
      return VIEW_TITLE[s.mode] || ''
    },
  },
  actions: {
    currentFrame(): NavFrame {
      return { mode: this.mode, playlistId: this.playlistId }
    },
    go(mode: AppView, opts?: { playlistId?: string | number | null, replace?: boolean }) {
      const next: NavFrame = {
        mode,
        playlistId: mode === 'playlist' ? (opts?.playlistId ?? null) : null,
      }
      if (sameFrame(this.currentFrame(), next))
        return
      if (!opts?.replace) {
        this.history.push(this.currentFrame())
        if (this.history.length > 40)
          this.history.shift()
      }
      this.mode = next.mode
      this.playlistId = next.playlistId
    },
    back() {
      const prev = this.history.pop()
      if (!prev)
        return
      this.mode = prev.mode
      this.playlistId = prev.playlistId
    },
    openPlaylist(id: string | number) {
      this.go('playlist', { playlistId: id })
    },
  },
})
