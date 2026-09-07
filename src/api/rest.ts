import { efetch } from '@meanc/webext-fetch'
import { encWbi, getWbiKeys } from './wbi'

async function getUserArc(params: object) {
  const defaultParams = {
    mid: 0,
    pn: 1,
    ps: 25,
    tid: 3,
    keyword: '',
    order: 'pubdate',
  }
  params = { ...defaultParams, ...params }
  const web_keys = await getWbiKeys()
  const img_key = web_keys.img_key
  const sub_key = web_keys.sub_key
  const query = encWbi(params, img_key, sub_key)
  const res = await fetch(`https://api.bilibili.com/x/space/wbi/arc/search?${query}`, {
    method: 'GET',
    headers: {
      Referer: 'https://message.bilibili.com/',
    },
  })

  return res.json()
}

async function getSeasonInfo(params: Record<string, any>) {
  const defaultParams = {
    mid: 1,
    season_id: 0,
  }
  params = { ...defaultParams, ...params }
  const url = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?${new URLSearchParams(params).toString()}`
  const res = await efetch(url, {
    method: 'GET',
    headers: {
      Referer: 'https://www.bilibili.com/',
    },
  })

  return res
}

async function getBiliCsrf() {
  const cookie = await chrome.cookies.get({
    url: 'https://www.bilibili.com',
    name: 'bili_jct',
  })
  return cookie?.value || ''
}

function getFavorites({ mid, rid }: { mid: number, rid?: number }) {
  const urlserachparams = new URLSearchParams()
  urlserachparams.set('up_mid', mid.toString())
  if (rid) {
    urlserachparams.set('type', '2')
    urlserachparams.set('rid', String(rid))
  }
  else {
    urlserachparams.set('type', '0')
  }

  return efetch(`https://api.bilibili.com/x/v3/fav/folder/created/list-all?${urlserachparams.toString()}`, {
    method: 'GET',
  })
}

async function addToBiliFavorite({ aid, mediaId }: { aid: number, mediaId: string | number }) {
  const csrf = await getBiliCsrf()
  if (!csrf)
    throw new Error('未登录 B 站')

  const body = new URLSearchParams()
  body.set('rid', String(aid))
  body.set('type', '2')
  body.set('add_media_ids', String(mediaId))
  body.set('csrf', csrf)
  body.set('platform', 'web')

  return efetch('https://api.bilibili.com/x/v3/fav/resource/deal', {
    method: 'POST',
    headers: {
      'Referer': 'https://www.bilibili.com/',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
}

async function createBiliFavoriteFolder(title: string) {
  const csrf = await getBiliCsrf()
  if (!csrf)
    throw new Error('未登录 B 站')

  const name = title.trim()
  if (!name)
    throw new Error('请填写收藏夹名称')

  const body = new URLSearchParams()
  body.set('title', name)
  body.set('privacy', '0')
  body.set('csrf', csrf)

  return efetch('https://api.bilibili.com/x/v3/fav/folder/add', {
    method: 'POST',
    headers: {
      'Referer': 'https://www.bilibili.com/',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
}

const getUserInfo = () => efetch('https://api.bilibili.com/x/web-interface/nav', {})

function getCollectedFavorites({ mid }: { mid: number }) {
  const urlserachparams = new URLSearchParams()
  urlserachparams.set('up_mid', mid.toString())
  urlserachparams.set('pn', '1')
  urlserachparams.set('ps', '70')
  urlserachparams.set('platform', 'web')
  return efetch(`https://api.bilibili.com/x/v3/fav/folder/collected/list?${urlserachparams.toString()}`, {
    method: 'GET',
  })
}

function getFollowings({ mid, pn = 1, ps = 50 }: { mid: number, pn?: number, ps?: number }) {
  const params = new URLSearchParams()
  params.set('vmid', String(mid))
  params.set('pn', String(pn))
  params.set('ps', String(ps))
  params.set('order_type', 'attention')
  return efetch(`https://api.bilibili.com/x/relation/followings?${params.toString()}`, {
    method: 'GET',
  })
}

function getPlayerV2({ bvid, cid }: { bvid: string, cid: string | number }) {
  const params = new URLSearchParams()
  params.set('bvid', bvid)
  params.set('cid', String(cid))
  return efetch(`https://api.bilibili.com/x/player/v2?${params.toString()}`, {
    method: 'GET',
    headers: {
      Referer: 'https://www.bilibili.com/',
    },
  })
}

function fetchRemoteJson(url: string) {
  const href = url.startsWith('http') ? url : `https:${url}`
  return efetch(href, { method: 'GET' })
}

export { addToBiliFavorite, createBiliFavoriteFolder, fetchRemoteJson, getBiliCsrf, getCollectedFavorites, getFavorites, getFollowings, getPlayerV2, getSeasonInfo, getUserArc, getUserInfo }
