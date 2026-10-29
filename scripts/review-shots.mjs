// 渲染验证：加载构建好的扩展，驱动关键页面与状态，按出货尺寸批量截图
// 用法: PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node scripts/review-shots.mjs [outDir]
import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from '@playwright/test'

const outDir = process.argv[2] || '.impeccable/review'
const extPath = path.resolve('extension')
const userDataDir = '/tmp/eno-review-profile'

// 只清旧截图，保留 PROVENANCE 等记录文件
mkdirSync(outDir, { recursive: true })
for (const f of (await import('node:fs')).readdirSync(outDir)) {
  if (f.endsWith('.png'))
    rmSync(path.join(outDir, f), { force: true })
}
rmSync(userDataDir, { recursive: true, force: true })

const context = await chromium.launchPersistentContext(userDataDir, {
  channel: 'chromium',
  headless: !process.env.SHOT_HEADED,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: [
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
    `--disable-extensions-except=${extPath}`,
    `--load-extension=${extPath}`,
  ],
})

let extId = ''
for (let i = 0; i < 40 && !extId; i++) {
  const sw = context.serviceWorkers()[0]
  if (sw?.url().startsWith('chrome-extension://'))
    extId = sw.url().split('/')[2]
  else
    await new Promise(r => setTimeout(r, 250))
}
if (!extId)
  throw new Error(`extension id not found (workers=${context.serviceWorkers().length})`)
console.log('extension id:', extId)

const seed = await context.newPage()
await seed.goto('https://www.bilibili.com', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
await seed.waitForTimeout(1500)
await seed.close()

const out = n => path.join(outDir, `${n}.png`)
const optsUrl = `chrome-extension://${extId}/dist/options/index.html`
const popupUrl = `chrome-extension://${extId}/dist/popup/index.html`

const page = await context.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(optsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(4000)

async function shot(name) {
  await page.screenshot({ path: out(name) })
  console.log('captured', `${name}.png`)
}

async function nav(label) {
  await page.locator('button', { hasText: label }).first().click()
  await page.waitForTimeout(2200)
}

// 首页（真实 B 站榜单）
await shot('desktop')

// 在听状态：点第一行起播 → 行尾朱印 + 封面朱印
await page.locator('.song-item').first().click()
await page.waitForTimeout(3500)
await page.locator('.song-item').nth(1).hover()
await shot('desktop-playing')

// 搜索（真实关键词；B 站匿名接口偶发空响应，重试至真实结果行出现）
await nav('搜索')
const input = page.locator('input').first()
await input.waitFor({ state: 'visible', timeout: 10000 })
for (let i = 0; i < 3; i++) {
  await input.fill('群青')
  await input.press('Enter')
  const ok = await page.waitForFunction(() => document.querySelectorAll('.song-item').length > 0, null, { timeout: 12000 }).then(() => true).catch(() => false)
  if (ok)
    break
  await page.waitForTimeout(1500)
}
await page.waitForTimeout(800)
console.log('search rows:', await page.locator('.song-item').count())
await shot('search')

// 媒体库 / 直播 / 关注人更新 / 设置 / 关于
await nav('媒体库')
await shot('library')
await nav('直播')
await shot('live')
await nav('关注人更新')
await shot('follow')
await nav('设置')
await shot('settings')

// Dialog 实景（新建播放列表弹窗：验证 eno-ui 重皮生效）
await page.locator('button[title="新建歌单"]').first().click()
await page.waitForTimeout(1200)
await shot('state-dialog')
await page.keyboard.press('Escape')
await page.waitForTimeout(600)

// MessageAPI 浮层实景（「稍后再听」成功提示）
await nav('首页')
const row2 = page.locator('.song-item').nth(1)
await row2.hover()
await row2.locator('.action-icon[title="稍后再听"]').first().click()
await page.waitForTimeout(400)
await shot('state-toast')
await page.waitForTimeout(3200)

// 断网错误态：拦截 B 站 API 后搜索 → 「搜索失败」声明 + 重试
await context.route(/bilibili\.com|biliapi/, route => route.abort())
await nav('搜索')
const input2 = page.locator('input').first()
await input2.waitFor({ state: 'visible', timeout: 10000 })
await input2.fill('群青')
await page.keyboard.press('Enter')
await page.waitForFunction(() => document.body.textContent.includes('搜索失败'), null, { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(600)
await shot('state-error')
await context.unroute(/bilibili\.com|biliapi/)

// 回首页换 1280 宽
await nav('首页')
await page.setViewportSize({ width: 1280, height: 800 })
await page.waitForTimeout(1200)
await shot('user-1280')
await page.close()

// popup：按内容高度裁切（工具栏弹窗按内容自适应）
const pop = await context.newPage()
await pop.setViewportSize({ width: 320, height: 580 })
await pop.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
await pop.waitForTimeout(3000)
const contentH = await pop.evaluate(() => Math.min(600, Math.ceil(Math.max(...[...document.body.children].map(el => el.getBoundingClientRect().bottom)) + 4)))
await pop.screenshot({ path: out('popup'), clip: { x: 0, y: 0, width: 320, height: Math.max(contentH, 240) } })
console.log('captured popup.png (content h =', contentH, ')')
await pop.close()

await context.close()
console.log('done →', outDir)
