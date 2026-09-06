import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'dist',
    'node_modules',
    'public',
    'extension/dist',
    'extension/manifest.json',
  ],
})
