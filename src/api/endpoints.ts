import { AHS } from './factory'
import { searchVideos } from './rest'

const baseUrl = 'https://api.bilibili.com'

const jsonGet = {
  method: 'get',
}

export default {
  getSong: {
    url: `${baseUrl}/audio/music-service-c/web/url`,
    _fetch: jsonGet,
    params: {
      sid: 0,
    },
    afterHandle: AHS.J,
  },
  search: (message: { keyword?: string, page?: number, page_size?: number }) => {
    return searchVideos(message)
  },
  getAudioOfVideo: {
    url: `${baseUrl}/x/player/playurl`,
    _fetch: jsonGet,
    params: {
      fnval: 16,
      bvid: '',
      cid: 0,
    },
    afterHandle: AHS.J,
  },
  getVideoInfo: {
    url: `${baseUrl}/x/web-interface/view`,
    _fetch: jsonGet,
    params: {
      bvid: '',
    },
    afterHandle: AHS.J,
  },
  getUserInfo: {
    url: `${baseUrl}/x/web-interface/card`,
    _fetch: jsonGet,
    params: {
      mid: 0,
    },
    afterHandle: AHS.J,
  },
  getMusicRankList: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/all_period`,
    _fetch: jsonGet,
    params: {
      list_type: 1,
    },
    afterHandle: AHS.J,
  },
  getMusicRank: {
    url: `${baseUrl}/x/copyright-music-publicity/toplist/music_list`,
    _fetch: jsonGet,
    params: {
      list_id: 207,
    },
    afterHandle: AHS.J,
  },
  getFavInfo: {
    url: `${baseUrl}/x/v3/fav/resource/list`,
    _fetch: jsonGet,
    params: {
      media_id: 0,
      ps: 20,
      pn: 1,
    },
    afterHandle: AHS.J,
  },
  getCollectionInfo: {
    url: `${baseUrl}/x/polymer/web-space/seasons_archives_list`,
    _fetch: jsonGet,
    params: {
      mid: 0,
      season_id: 0,
      sort_reverse: false,
      page_num: 1,
      page_size: 30,
    },
    afterHandle: AHS.J,
  },
  getSeriesInfo: {
    url: `${baseUrl}/x/series/archives`,
    _fetch: jsonGet,
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
