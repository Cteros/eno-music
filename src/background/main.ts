import type { PlayerEnvelope, PlayerPopupState } from '~/shared/playerBridge'
import { backgroundListener } from '@meanc/webext-fetch'
import { chromeStorageLocal, onChromeStorageChanged, onExtMessage, sendExtMessage } from '~/shared/chromeApi'
import { PLAYER_STATE_KEY } from '~/shared/playerBridge'
import { resolvePlayUrl } from '~/shared/resolvePlayUrl'

backgroundListener()

const OFFSCREEN_URL = 'dist/offscreen/index.html'
let creating: Promise<void> | null = null

function runtimeSendMessage(message: unknown): Promise<any> {
  return sendExtMessage(message)
}

function getOffscreenApi() {
  return (globalThis as any).chrome?.offscreen as {
    createDocument: (options: {
      url: string
      reasons: string[]
      justification: string
    }) => Promise<void>
  } | undefined
}

async function hasOffscreenDocument() {
  const runtime = (globalThis as any).chrome?.runtime
  if (!runtime?.getContexts)
    return false
  const contexts = await runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  })
  return contexts.length > 0
}

async function ensureOffscreenDocument() {
  const offscreen = getOffscreenApi()
  if (!offscreen)
    throw new Error('当前浏览器不支持后台播放')

  if (await hasOffscreenDocument())
    return

  if (creating) {
    await creating
    return
  }

  creating = offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play user-started Bilibili audio after the popup and options pages close. The offscreen document exists only for AUDIO_PLAYBACK with Howler; it is not used for ads, tracking, or a visible UI.',
  }).catch(async (error) => {
    if (String(error).includes('Only a single offscreen'))
      return
    throw error
  }).finally(() => {
    creating = null
  }) as Promise<void>

  await creating
  await new Promise(resolve => setTimeout(resolve, 80))
}

async function sendToOffscreen(message: PlayerEnvelope, retries = 8) {
  await ensureOffscreenDocument()
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await runtimeSendMessage({
        ...message,
        target: 'offscreen',
      })
      if (result)
        return result
      throw new Error('offscreen empty response')
    }
    catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, 120 * (attempt + 1)))
      await ensureOffscreenDocument()
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function handleBackgroundMessage(envelope: PlayerEnvelope) {
  if (envelope.type === 'ENO_STORAGE_GET') {
    const data = await chromeStorageLocal().get(envelope.keys as any)
    return { ok: true, data }
  }

  if (envelope.type === 'ENO_STORAGE_SET') {
    const items = envelope.items || {}
    await chromeStorageLocal().set(items)
    if (items[PLAYER_STATE_KEY])
      applyBadge(items[PLAYER_STATE_KEY] as PlayerPopupState)
    return { ok: true }
  }

  if (envelope.type === 'ENO_RESOLVE_URL') {
    const song = await resolvePlayUrl(envelope.song || {})
    return { ok: true, song }
  }

  if (envelope.type === 'ENO_PLAYER_PLAY' && envelope.song && !envelope.song.url)
    envelope.song = await resolvePlayUrl(envelope.song)

  return sendToOffscreen(envelope)
}

function onBackgroundMessage(message: unknown, _sender: unknown, sendResponse: (response: unknown) => void) {
  const envelope = message as PlayerEnvelope
  if (!envelope || envelope.target !== 'background')
    return false

  handleBackgroundMessage(envelope)
    .then(result => sendResponse(result))
    .catch((error) => {
      console.warn('[background] player route failed', error)
      sendResponse({ ok: false, error: String(error) })
    })

  return true
}

onExtMessage(onBackgroundMessage as any)

function chromeAction() {
  return (globalThis as any).chrome?.action
}

function applyBadge(state?: PlayerPopupState) {
  const action = chromeAction()
  if (!action?.setBadgeText)
    return
  const playing = Boolean(state?.isPlaying)
  action.setBadgeText({ text: playing ? 'ON' : '' })
  if (playing && action.setBadgeBackgroundColor)
    action.setBadgeBackgroundColor({ color: '#1ed760' })
  if (action.setTitle) {
    const song = state?.title && state.title !== '暂无歌曲' ? state.title : ''
    action.setTitle({
      title: playing && song ? `ENO-M · ${song}` : 'ENO-M',
    })
  }
}

onChromeStorageChanged((changes, area) => {
  if (area !== 'local' || !changes[PLAYER_STATE_KEY])
    return
  applyBadge(changes[PLAYER_STATE_KEY].newValue as PlayerPopupState)
})

void chromeStorageLocal().get(PLAYER_STATE_KEY).then((data) => {
  applyBadge(data[PLAYER_STATE_KEY] as PlayerPopupState)
}).catch(() => {})
