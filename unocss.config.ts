import { defineConfig } from 'unocss/vite'
import { presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  shortcuts: {
    'btn': 'bg-white text-black font-700 px-5 py-2 h-10 rounded-full cursor-pointer hover:scale-104 transition-transform duration-120',
    'btn-primary': 'btn bg-$eno-primary hover:bg-$eno-primary-hover text-black h-10',
    'hov-item': 'hover:bg-$eno-fill-1 cursor-pointer rounded-md transition-colors duration-150',
    'has-border': 'border border-$eno-border',
    'sp-page': 'w-full h-full overflow-auto pb-28 px-6 pt-4',
  },
})
