import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { VIDEO_MODE } from './types'
import type { VideoMode } from './types'

export { VIDEO_MODE }

export const useUiStore = defineStore('ui', {
  state: () => ({
    mode: 'home' as string,
    videoMode: useStorage('videoMode', VIDEO_MODE.FLOATING as VideoMode),
  }),
})
