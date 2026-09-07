// generate stub index.html files for dev entry
import { execSync } from 'node:child_process'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import { isDev, log, port, r } from './utils'

const OFFSCREEN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>ENO-M Offscreen Audio</title>
</head>
<body>
  <script src="./index.js"></script>
</body>
</html>
`

async function writeOffscreenHtml() {
  await fs.ensureDir(r('extension/dist/offscreen'))
  await fs.writeFile(r('extension/dist/offscreen/index.html'), OFFSCREEN_HTML)
  log('PRE', 'stub offscreen')
}

/**
 * Stub index.html to use Vite in development
 */
async function stubIndexHtml() {
  const views = [
    'options',
    'popup',
  ]

  for (const view of views) {
    await fs.ensureDir(r(`extension/dist/${view}`))
    let data = await fs.readFile(r(`src/${view}/index.html`), 'utf-8')
    data = data.replace('"./main.ts"', `"http://localhost:${port}/${view}/main.ts"`)
    await fs.writeFile(r(`extension/dist/${view}/index.html`), data, 'utf-8')
    log('PRE', `stub ${view}`)
  }
  await writeOffscreenHtml()
}

function writeManifest() {
  execSync('npx esno ./scripts/manifest.ts', { stdio: 'inherit' })
}

writeManifest()

if (isDev) {
  stubIndexHtml()
  chokidar.watch(r('src/**/*.html'))
    .on('change', () => {
      stubIndexHtml()
    })
  chokidar.watch([r('src/manifest.ts'), r('package.json')])
    .on('change', () => {
      writeManifest()
    })
}
else {
  void writeOffscreenHtml()
}
