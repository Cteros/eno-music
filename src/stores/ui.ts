import type { VideoMode } from './types'
import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { VIDEO_MODE } from './types'

export { VIDEO_MODE }

export const useUiStore = defineStore('ui', {
  state: () => ({
    mode: 'home' as string,
    videoMode: useStorage('videoMode', VIDEO_MODE.FLOATING as VideoMode),
  }),
})
