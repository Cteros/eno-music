/* eslint-disable no-console */
import { useLocalStorage } from '@vueuse/core'
import { getUserInfo } from '~/api'

export function useBiliCookie() {
  const CST = useLocalStorage('cookieSetTime', 0)
  const userInfo = ref({})

  function getCookie() {
    // 这部分暂时不删除, 调试太麻烦
    const domain = 'https://api.bilibili.com'
    fetch(domain, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'include',
    }).then((res) => {
      const cookie = res.headers.get('set-cookie')

      chrome.cookies?.set({
        ...cookie as any,
      })
    })
  }

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
            else
              console.log(`Cookie ${cookie.name} set`)
          })
        })
      }
      else {
        console.log('No Bilibili cookies found')
      }
    })
  }

  function syncCookieAndUser() {
    getBLCookie()
    if (Date.now() - CST.value > 24 * 60 * 60 * 1000) {
      CST.value = Date.now()
      getCookie()
    }
    getUserInfo().then((res: any) => {
      userInfo.value = res.data
    })
  }

  return {
    userInfo,
    syncCookieAndUser,
  }
}
