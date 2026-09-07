import type { PlayerEnvelope } from '~/shared/playerBridge'
import { onExtMessage } from '~/shared/chromeApi'
import { engine } from './engine'

function onOffscreenMessage(message: unknown, _sender: unknown, sendResponse: (response: unknown) => void) {
  const envelope = message as PlayerEnvelope
  if (!envelope || envelope.target !== 'offscreen')
    return false

  const run = async () => {
    switch (envelope.type) {
      case 'ENO_PLAYER_PLAY':
        return engine.playSong(envelope.song || {}, envelope.playList, envelope.loopMode)
      case 'ENO_PLAYER_CMD':
        return engine.handleCmd(envelope.cmd || 'toggle')
      case 'ENO_PLAYER_SEEK':
        if (typeof envelope.seekRatio === 'number')
          return engine.seekRatio(envelope.seekRatio)
        return engine.seekTo(Number(envelope.seekTo) || 0)
      case 'ENO_PLAYER_VOLUME':
        return engine.setVolume(Number(envelope.volume))
      case 'ENO_PLAYER_SET_LOOP':
        return engine.setLoopMode(envelope.loopMode || 'list')
      case 'ENO_PLAYER_SET_PLAYLIST':
        return engine.setPlayList(envelope.playList || [])
      case 'ENO_PLAYER_SET_EQ':
        return engine.setEq(envelope.eqValues || [])
      case 'ENO_PLAYER_SET_RATE':
        return engine.setRate(Number(envelope.rate) || 1)
      case 'ENO_PLAYER_SET_SLEEP':
        return engine.setSleep(Number(envelope.sleepMinutes) || 0, Boolean(envelope.sleepAfterCurrent))
      case 'ENO_PLAYER_GET_STATE':
        return engine.getState()
      default:
        return engine.getState()
    }
  }

  run()
    .then(async () => {
      const state = await engine.publish()
      sendResponse({ ok: true, state })
    })
    .catch((error) => {
      console.warn('[offscreen] message failed', error)
      sendResponse({ ok: false, error: String(error), state: engine.getState() })
    })

  return true
}

onExtMessage(onOffscreenMessage as any)

void engine.publish()
