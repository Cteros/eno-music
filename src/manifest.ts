import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, isFirefox, port, r } from '../scripts/utils'

export async function getManifest() {
  const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    declarative_net_request: {
      rule_resources: [
        {
          id: 'referrer-blbl',
          enabled: true,
          path: 'assets/referrer.json',
        },
      ],
    },
    action: {
      default_icon: 'assets/128px.png',
    },
    options_ui: {
      page: 'dist/options/index.html',
      open_in_tab: true,
    },
    background: isFirefox
      ? {
          scripts: ['dist/background/index.mjs'],
          type: 'module',
        }
      : {
          service_worker: 'dist/background/index.mjs',
          type: 'module',
        },
    icons: {
      16: 'assets/128px.png',
      48: 'assets/128px.png',
      128: 'assets/128px.png',
    },
    permissions: [
      'storage',
      'cookies',
      'declarativeNetRequest',
      'declarativeNetRequestFeedback',
    ],
    host_permissions: [
      'https://*.bilibili.com/*',
      'https://*.bilivideo.com/*',
      'https://*.bilivideo.cn/*',
    ],
    content_security_policy: {
      extension_pages: isDev
        // this is required on dev for Vite script to load
        ? `script-src \'self\' http://localhost:${port}; object-src \'self\'`
        : 'script-src \'self\'; object-src \'self\'',
    },
  }

  return manifest
}
