import { expect, test } from './fixtures'

test('options page', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/dist/options/index.html`)
  await expect(page.locator('.brand-text')).toHaveText('ENO-M')
})
