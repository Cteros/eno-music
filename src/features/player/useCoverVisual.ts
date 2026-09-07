import type { CoverPalette } from './coverPalette'
import { ref, watch } from 'vue'
import { EMPTY_PALETTE, extractCoverPalette, normalizeCoverUrl } from './coverPalette'

const palette = ref<CoverPalette>({ ...EMPTY_PALETTE })
const coverSrc = ref('')
let token = 0

function applyVars(el: HTMLElement | null) {
  if (!el)
    return
  el.style.setProperty('--eno-cover-accent', palette.value.accent)
  el.style.setProperty('--eno-cover-wash', palette.value.wash)
  el.style.setProperty('--eno-cover-dim', palette.value.dim)
}

export function useCoverVisual(cover: () => string | undefined) {
  const root = ref<HTMLElement | null>(null)

  async function load(url: string) {
    const href = normalizeCoverUrl(url)
    const job = ++token
    coverSrc.value = href
    if (!href) {
      palette.value = { ...EMPTY_PALETTE }
      applyVars(root.value)
      return
    }
    try {
      const next = await extractCoverPalette(href)
      if (job !== token)
        return
      palette.value = next || { ...EMPTY_PALETTE }
    }
    catch {
      if (job !== token)
        return
      palette.value = { ...EMPTY_PALETTE }
    }
    applyVars(root.value)
  }

  watch(() => cover(), value => void load(value || ''), { immediate: true })
  watch(root, (el) => {
    applyVars(el)
  })

  return {
    root,
    palette,
    coverSrc,
  }
}
