// 这个文件不要引用其他文件，我怕打包时候会把引用的部分也打包成两分
// en: This file should not reference other files, I am afraid that the referenced part will also be packaged into two parts when packaging

enum BLBL {
  GET_COOKIE = 'getCookie',
  GET_RANK = 'getRank',
  GET_RANK_DETAIL = 'getRankDetail',
  GET_RANK_DETAIL_LIST = 'getRankDetailList',
  GET_SONG_DETAIL = 'getSongDetail',
  GET_HIT_SONG = 'getHitSong',
  GET_HIT_SONG_LIST = 'getHitSongList',
  GET_SONG = 'getSong',
  GET_MENU_RANK = 'getMenuRank',
  GET_SONG_INFO = 'getSongInfo',
  SEARCH = 'search',
  GET_AUDIO_OF_VIDEO = 'getAudioOfVideo',
  GET_VIDEO_INFO = 'getVideoInfo',
  GET_USER_INFO = 'getUserInfo',
  GET_RANKING = 'getRanking',
  GET_MUSIC_RANK_LIST = 'getMusicRankList',
  GET_MUSIC_RANK = 'getMusicRank',
  GET_FAV_INFO = 'getFavInfo',
  GET_COLLECTION_INFO = 'getCollectionInfo',
  GET_SERIES_INFO = 'getSeriesInfo',
}

const API = {
  BLBL,
}

export {
  API,
  BLBL,
}

export default API
