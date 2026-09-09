import type { PlayerEnvelope } from '~/shared/playerBridge'
import { onMounted, onUnmounted } from 'vue'
import { offExtMessage, onExtMessage } from '~/shared/chromeApi'

function applyBass(value = 0) {
  const next = Math.max(0, Math.min(1, value))
  document.documentElement.style.setProperty('--eno-bass', next.toFixed(3))
}

function onVizMessage(
  message: unknown,
  _sender: unknown,
  _sendResponse: (response: unknown) => void,
) {
  const envelope = message as PlayerEnvelope
  if (envelope?.target !== 'ui' || envelope.type !== 'ENO_VIZ')
    return false
  applyBass(envelope.viz?.bass || 0)
  return false
}

export function useVizMotion() {
  onMounted(() => {
    applyBass(0)
    onExtMessage(onVizMessage)
  })
  onUnmounted(() => {
    offExtMessage(onVizMessage)
    applyBass(0)
  })
}
