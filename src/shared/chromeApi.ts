function chromeExt() {
  return (globalThis as any).chrome
}

export function chromeRuntime() {
  const runtime = chromeExt()?.runtime
  if (!runtime)
    throw new Error('chrome.runtime 不可用')
  return runtime
}

function getStorageLocal() {
  const chrome = chromeExt()
  return chrome?.storage?.local
    || (globalThis as any).browser?.storage?.local
    || null
}

export function chromeStorageLocal() {
  const local = getStorageLocal()
  if (!local)
    throw new Error('chrome.storage.local 不可用')
  return local
}

let storageMode: 'unknown' | 'direct' | 'proxy' = 'unknown'

async function resolveStorageLocal() {
  if (storageMode === 'direct')
    return getStorageLocal()
  if (storageMode === 'proxy')
    return null

  const immediate = getStorageLocal()
  if (immediate) {
    storageMode = 'direct'
    return immediate
  }

  const started = Date.now()
  while (Date.now() - started < 400) {
    await new Promise(resolve => setTimeout(resolve, 40))
    const local = getStorageLocal()
    if (local) {
      storageMode = 'direct'
      return local
    }
  }

  storageMode = 'proxy'
  return null
}

export async function storageLocalGet(keys: string | string[] | Record<string, unknown> | null = null) {
  const local = await resolveStorageLocal()
  if (local)
    return local.get(keys as any)

  const result = await sendExtMessage({
    target: 'background',
    type: 'ENO_STORAGE_GET',
    keys,
  })
  if (!result?.ok)
    throw new Error(result?.error || 'chrome.storage.local 不可用')
  return result.data || {}
}

export async function storageLocalSet(items: Record<string, unknown>) {
  const local = await resolveStorageLocal()
  if (local)
    return local.set(items)

  const result = await sendExtMessage({
    target: 'background',
    type: 'ENO_STORAGE_SET',
    items,
  })
  if (!result?.ok)
    throw new Error(result?.error || 'chrome.storage.local 不可用')
}

export function sendExtMessage(message: unknown): Promise<any> {
  const runtime = chromeRuntime()
  return new Promise((resolve, reject) => {
    runtime.sendMessage(message, (response: unknown) => {
      const err = runtime.lastError
      if (err)
        reject(new Error(err.message))
      else
        resolve(response)
    })
  })
}

export function onExtMessage(
  listener: (
    message: unknown,
    sender: unknown,
    sendResponse: (response: unknown) => void,
  ) => boolean | void,
) {
  chromeRuntime().onMessage.addListener(listener)
}

export function offExtMessage(
  listener: (
    message: unknown,
    sender: unknown,
    sendResponse: (response: unknown) => void,
  ) => boolean | void,
) {
  chromeExt()?.runtime?.onMessage.removeListener(listener)
}

export function broadcastExtMessage(message: unknown) {
  const runtime = chromeExt()?.runtime
  if (!runtime?.sendMessage)
    return
  try {
    runtime.sendMessage(message, () => {
      void runtime.lastError
    })
  }
  catch {
    // no listening UI yet
  }
}

export function onChromeStorageChanged(
  listener: (
    changes: Record<string, { newValue?: unknown, oldValue?: unknown }>,
    area: string,
  ) => void,
) {
  chromeExt()?.storage?.onChanged.addListener(listener)
}

export function offChromeStorageChanged(
  listener: (
    changes: Record<string, { newValue?: unknown, oldValue?: unknown }>,
    area: string,
  ) => void,
) {
  chromeExt()?.storage?.onChanged.removeListener(listener)
}
