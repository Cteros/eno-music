// 这个文件不要引用其他文件，我怕打包时候会把引用的部分也打包成两分
// en: This file should not reference other files, I am afraid that the referenced part will also be packaged into two parts when packaging

enum BLBL {
  GET_RANK = 'getRank',
  GET_RANK_DETAIL = 'getRankDetail',
  GET_RANK_DETAIL_LIST = 'getRankDetailList',
}

const API = {
  BLBL,
}

export {
  API,
  BLBL,
}

export default API