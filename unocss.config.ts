import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

function loadIconifyCollection(name: string) {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `node_modules/@iconify/json/json/${name}.json`), 'utf8'),
  )
}

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.1,
      collections: {
        'tabler': () => loadIconifyCollection('tabler'),
        'mingcute': () => loadIconifyCollection('mingcute'),
        'mdi': () => loadIconifyCollection('mdi'),
        'svg-spinners': () => loadIconifyCollection('svg-spinners'),
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
  safelist: [
    'i-tabler:smart-home',
    'i-tabler:search',
    'i-tabler:playlist',
    'i-tabler:user-star',
    'i-tabler:clock-play',
    'i-tabler:music',
    'i-tabler:player-play-filled',
    'i-tabler:player-pause-filled',
    'i-tabler:player-track-prev-filled',
    'i-tabler:player-track-next-filled',
    'i-mingcute:folder-fill',
    'i-mingcute:folder-open-2-fill',
    'i-mingcute:disc-fill',
  ],
  shortcuts: {
    'btn': 'bg-white text-black font-700 px-5 py-2 h-10 rounded-full cursor-pointer hover:scale-104 transition-transform duration-120',
    'btn-primary': 'btn bg-$eno-primary hover:bg-$eno-primary-hover text-black h-10',
    'hov-item': 'hover:bg-$eno-fill-1 cursor-pointer rounded-md transition-colors duration-150',
    'has-border': 'border border-$eno-border',
    'sp-page': 'w-full h-full overflow-auto pb-28 px-6 pt-4',
  },
})
