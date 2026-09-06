import { onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import {
  PLAYER_CMD,
  PLAYER_PENDING_CMD_KEY,
  PLAYER_STATE_KEY,
  type PlayerRemoteCmd,
} from '~/shared/playerBridge'
import type { Song } from '~/stores/types'

interface ProgressLike {
  current: number
  total: number
  percent: number
}

interface UsePlayerRemoteControlOptions {
  isPlaying: Ref<boolean>
  progress: ProgressLike
  getPlay: () => Song
  playControl: () => void | Promise<void>
  change: (type: 'prev' | 'next') => void
}

export function usePlayerRemoteControl(options: UsePlayerRemoteControlOptions) {
  let publishTimer: number | null = null

  function buildState() {
    const song = options.getPlay() || {} as Song
    const hasSong = Boolean(song?.id || song?.bvid || song?.title)
    return {
      title: String(song?.title || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim() || '暂无歌曲',
      author: song?.author || '',
      cover: song?.cover || '',
      isPlaying: options.isPlaying.value,
      hasSong,
      current: options.progress.current || 0,
      total: options.progress.total || 0,
      updatedAt: Date.now(),
    }
  }

  async function publishState() {
    try {
      await browser.storage.local.set({
        [PLAYER_STATE_KEY]: buildState(),
      })
    }
    catch (error) {
      console.warn('[player-bridge] publish failed', error)
    }
  }

  async function handleCmd(cmd: PlayerRemoteCmd) {
    if (cmd === 'toggle' || cmd === 'play' || cmd === 'pause') {
      const playing = options.isPlaying.value
      if (cmd === 'play' && playing)
        return
      if (cmd === 'pause' && !playing)
        return
      await options.playControl()
      return
    }
    if (cmd === 'prev' || cmd === 'next')
      options.change(cmd)
  }

  function onMessage(
    message: { type?: string, cmd?: PlayerRemoteCmd },
    _sender: unknown,
    sendResponse: (response: { ok: boolean }) => void,
  ) {
    if (message?.type !== PLAYER_CMD || !message.cmd)
      return undefined

    Promise.resolve(handleCmd(message.cmd))
      .then(async () => {
        await publishState()
        sendResponse({ ok: true })
      })
      .catch((error) => {
        console.warn('[player-bridge] cmd failed', error)
        sendResponse({ ok: false })
      })

    return true
  }

  async function consumePendingCmd() {
    try {
      const data = await browser.storage.local.get(PLAYER_PENDING_CMD_KEY)
      const cmd = data[PLAYER_PENDING_CMD_KEY] as PlayerRemoteCmd | undefined
      if (!cmd)
        return
      await browser.storage.local.remove(PLAYER_PENDING_CMD_KEY)
      await handleCmd(cmd)
      await publishState()
    }
    catch (error) {
      console.warn('[player-bridge] pending cmd failed', error)
    }
  }

  onMounted(() => {
    browser.runtime.onMessage.addListener(onMessage)
    publishState()
    consumePendingCmd()
    publishTimer = window.setInterval(() => {
      if (options.isPlaying.value)
        publishState()
    }, 1000)
  })

  onUnmounted(() => {
    browser.runtime.onMessage.removeListener(onMessage)
    if (publishTimer)
      clearInterval(publishTimer)
    browser.storage.local.set({
      [PLAYER_STATE_KEY]: {
        ...buildState(),
        isPlaying: false,
        updatedAt: Date.now(),
      },
    }).catch(() => {})
  })

  watch(
    () => [
      options.isPlaying.value,
      options.getPlay()?.id,
      options.getPlay()?.title,
      options.getPlay()?.cover,
      options.progress.current,
      options.progress.total,
    ],
    () => {
      publishState()
    },
  )
}
