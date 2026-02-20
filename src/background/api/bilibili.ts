import { AHS } from '../utils'
import { BLBL } from '../msg.define'

const baseUrl = 'https://api.bilibili.com'

const api = {
  [BLBL.GET_COOKIE]: {
    url: 'https://bilibili.com',
    _fetch: {
      method: 'get',
    },
    afterHandle: [],
  },
  [BLBL.GET_RANK]: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/all_period`,
    _fetch: {
      method: 'get',
    },
    params: {
      list_type: 1, // 1: 热榜, 2: 原创榜
    },
    afterHandle: AHS.J,
  },
  [BLBL.GET_RANK_DETAIL]: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/detail`,
    _fetch: {
      method: 'get',
    },
    params: {
      list_id: 0, // 榜单id
    },
    afterHandle: AHS.J,
  },
  [BLBL.GET_RANK_DETAIL_LIST]: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/music_list`,
    _fetch: {
      method: 'get',
    },
    params: {
      list_id: 0, // 榜单id
    },
    afterHandle: AHS.J,
  },
  [BLBL.GET_SONG_DETAIL]: {
    url: `${baseUrl}/audio/music-service-c/web/song/info`,
    _fetch: {
      method: 'get',
    },
    params: {
      sid: 0, // 歌曲id
    },
    afterHandle: AHS.J,
  },
  [BLBL.GET_HIT_SONG]: {
    // https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=1
    url: `${baseUrl}/audio/music-service-c/web/menu/hit`,
    _fetch: {
      method: 'get',
    },
    params: {
      ps: 20, // 每页数量
      pn: 1, // 页数
    },
    afterHandle: AHS.J,
  },
  /// audio/music-service-c/web/song/of-menu
  [BLBL.GET_HIT_SONG_LIST]: {
    url: `${baseUrl}/audio/music-service-c/web/song/of-menu`,
    _fetch: {
      method: 'get',
    },
    params: {
      sid: 0, // 歌单id
      ps: 100, // 每页数量
      pn: 1, // 页数
    },
    afterHandle: AHS.J,
  },
  // https://www.bilibili.com/audio/music-service-c/web/url?sid=276736
  [BLBL.GET_SONG]: {
    url: `${baseUrl}/audio/music-service-c/web/url`,
    _fetch: {
      method: 'get',
    },
    params: {
      sid: 0, // 歌曲id
    },
    afterHandle: AHS.J,
  },
  // https://www.bilibili.com/audio/music-service-c/web/menu/rank
  [BLBL.GET_MENU_RANK]: {
    url: `${baseUrl}/audio/music-service-c/web/menu/rank`,
    _fetch: {
      method: 'get',
    },
    params: {
      ps: 3, // 每页数量
      pn: 1, // 页数
    },
    afterHandle: AHS.J,
  },
  // https://www.bilibili.com/audio/music-service-c/web/song/info
  [BLBL.GET_SONG_INFO]: {
    url: `${baseUrl}/audio/music-service-c/web/song/info`,
    _fetch: {
      method: 'get',
    },
    params: {
      sid: 0,
    },
    afterHandle: AHS.J,
  },
  // https://api.bilibili.com/x/web-interface/search/type?__refresh__=true&_extra=&context=&page=1&page_size=42&platform=pc&highlight=1&single_column=0&keyword=%E9%82%93%E7%B4%AB%E6%A3%8B&category_id=&search_type=video&dynamic_offset=0&preload=true&com2co=true
  [BLBL.SEARCH]: {
    url: `${baseUrl}/x/web-interface/search/type`,
    _fetch: {
      method: 'get',
    },
    params: {
      page: 1,
      page_size: 42,
      platform: 'pc',
      highlight: 1,
      single_column: 0,
      keyword: '',
      category_id: '',
      search_type: 'video',
      dynamic_offset: 0,
      preload: true,
      com2co: true,
    },
    afterHandle: AHS.J,
  },
  // https://api.bilibili.com/x/player/playurl?fnval=16&bvid=BV1jh4y1G7oT&cid=1157282735
  [BLBL.GET_AUDIO_OF_VIDEO]: {
    url: `${baseUrl}/x/player/playurl`,
    _fetch: {
      method: 'get',
    },
    params: {
      fnval: 16,
      bvid: '',
      cid: 0,
    },
    afterHandle: AHS.J,
  },
  // https://api.bilibili.com/x/web-interface/view?bvid=BV1BL411Y7kc
  // 需要这个获取cid
  [BLBL.GET_VIDEO_INFO]: {
    url: `${baseUrl}/x/web-interface/view`,
    _fetch: {
      method: 'get',
    },
    params: {
      bvid: '',
    },
    afterHandle: AHS.J,
  },
  // 获取用户信息 https://api.bilibili.com/x/web-interface/card
  [BLBL.GET_USER_INFO]: {
    url: `${baseUrl}/x/web-interface/card`,
    _fetch: {
      method: 'get',
    },
    params: {
      mid: 0,
    },
    afterHandle: AHS.J,
  },
  // https://api.bilibili.com/x/web-interface/ranking/v2
  [BLBL.GET_RANKING]: {
    url: `${baseUrl}/x/web-interface/ranking/v2`,
    _fetch: {
      method: 'get',
    },
    params: {
      tid: 3,
    },
    afterHandle: AHS.J,
  },
  // 音乐榜单的列表https://api.bilibili.com/x/copyright-music-publicity/toplist/all_period
  [BLBL.GET_MUSIC_RANK_LIST]: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/all_period`,
    _fetch: {
      method: 'get',
    },
    params: {
      list_type: 1, // 变化的
    },
    afterHandle: AHS.J,
  },
  // 全站音乐榜单
  [BLBL.GET_MUSIC_RANK]: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/music_list`,
    _fetch: {
      method: 'get',
    },
    params: {
      list_id: 207, // 变化的
    },
    afterHandle: AHS.J,
  },
  // https://api.bilibili.com/x/v3/fav/resource/list
  // 收藏夹信息
  [BLBL.GET_FAV_INFO]: {
    url: `${baseUrl}/x/v3/fav/resource/list`,
    _fetch: {
      method: 'get',
    },
    params: {
      media_id: 0,
      ps: 20,
      pn: 1,
    },
    afterHandle: AHS.J,
  },
  // 获取视频合集信息
  [BLBL.GET_COLLECTION_INFO]: {
    url: `${baseUrl}/x/polymer/web-space/seasons_archives_list`,
    _fetch: {
      method: 'get',
    },
    params: {
      mid: 0,
      season_id: 0,
      sort_reverse: false,
      page_num: 1,
      page_size: 30,
    },
    afterHandle: AHS.J,
  },
  // 获取系列信息
  [BLBL.GET_SERIES_INFO]: {
    url: `${baseUrl}/x/series/archives`,
    _fetch: {
      method: 'get',
    },
    params: {
      mid: 0,
      series_id: 0,
      only_normal: true,
      sort: 'desc',
      pn: 1,
      ps: 20,
    },
    afterHandle: AHS.J,
  },
}

export default api
