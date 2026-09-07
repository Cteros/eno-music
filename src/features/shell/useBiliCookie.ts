import { useLocalStorage } from '@vueuse/core'
import { getUserInfo } from '~/api'

export function useBiliCookie() {
  const CST = useLocalStorage('cookieSetTime', 0)
  const userInfo = ref<Record<string, any>>({})
  const ready = ref(false)

  function getBLCookie() {
    chrome.cookies.getAll({ domain: '.bilibili.com' }, (cookies) => {
      if (cookies.length > 0) {
        cookies.forEach((cookie) => {
          chrome.cookies.set({
            url: 'https://www.bilibili.com',
            name: cookie.name,
            value: cookie.value,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate,
          }, () => {
            if (chrome.runtime.lastError)
              console.error(`Error setting cookie ${cookie.name}: ${chrome.runtime.lastError}`)
          })
        })
      }
    })
  }

  function syncCookieAndUser() {
    getBLCookie()
    CST.value = Date.now()
    getUserInfo().then((res: any) => {
      userInfo.value = res.data || {}
    }).catch((error) => {
      console.warn('[cookie] getUserInfo failed', error)
    }).finally(() => {
      ready.value = true
    })
  }

  return {
    userInfo,
    ready,
    syncCookieAndUser,
  }
}
