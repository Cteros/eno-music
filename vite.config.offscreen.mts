import { defineConfig } from 'vite'
import packageJson from './package.json' with { type: 'json' }
import { isDev, r } from './scripts/utils.ts'
import { sharedConfig } from './vite.config.mts'

export default defineConfig({
  ...sharedConfig,
  define: {
    '__DEV__': isDev,
    '__NAME__': JSON.stringify(packageJson.name),
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  build: {
    watch: isDev
      ? {}
      : undefined,
    outDir: r('extension/dist/offscreen'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    lib: {
      entry: r('src/offscreen/main.ts'),
      name: 'enoOffscreen',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        extend: true,
      },
    },
  },
})
