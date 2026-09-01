import { useActiveElement, useMagicKeys, whenever } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'

interface ControlOptions {
  play: () => void
  forward?: () => void
  back?: () => void
}

function useControl(callbacks: ControlOptions) {
  const activeElement = useActiveElement()
  const notUsingInput = computed(() =>
    activeElement.value?.tagName !== 'INPUT'
    && activeElement.value?.tagName !== 'TEXTAREA')

  const keys = useMagicKeys()

  whenever(logicAnd(keys.space, notUsingInput), () => {
    callbacks.play()
  })
  whenever(logicAnd(keys.arrowRight, notUsingInput), () => {
    callbacks.forward?.()
  })
  whenever(logicAnd(keys.arrowLeft, notUsingInput), () => {
    callbacks.back?.()
  })
}

export default useControl
