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
    'btn': 'bg-$eno-content hover:bg-$eno-content-hover text-$eno-text-1 border border-$eno-border px-5 py-1 h-10 rounded-3 cursor-pointer transition-all duration-180',
    'btn-primary': 'btn bg-$eno-primary/90 hover:bg-$eno-primary border-$eno-primary/50 text-black h-10',
    'hov-item': 'hover:bg-$eno-fill-1 cursor-pointer p-2 pr-4 rounded-3 transition-all duration-200',
    'has-border': 'border border-$eno-border',
  },
})
