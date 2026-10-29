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
    'i-tabler:folder',
    'i-tabler:folder-open',
    'i-tabler:disc',
  ],
  theme: {
    borderRadius: {
      'none': '0',
      'sm': '2px',
      'DEFAULT': '3px',
      'md': '3px',
      'lg': '4px',
      'xl': '6px',
      '2xl': '8px',
      'full': '9999px',
    },
  },
  shortcuts: {
    'btn': 'inline-flex items-center justify-center gap-2 border border-$eno-border bg-$eno-fill-2 text-$eno-text-1 font-600 px-4 h-9 rounded-md cursor-pointer transition-colors duration-150 hover:bg-$eno-fill-3 active:translate-y-px disabled:opacity-45 disabled:cursor-default disabled:active:translate-y-0',
    'btn-primary': 'btn border-transparent bg-$eno-primary text-[#f0ebdd] font-700 hover:bg-$eno-primary-hover',
    'hov-item': 'hover:bg-$eno-fill-1 cursor-pointer rounded-md transition-colors duration-150',
    'has-border': 'border border-$eno-border',
    'sp-page': 'w-full h-full overflow-auto pb-28 px-6 pt-4',
  },
})
