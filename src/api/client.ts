import { createApiProxy } from './factory'
import endpoints from './endpoints'

const apiProxy = createApiProxy(endpoints)

// eslint-disable-next-line ts/no-unsafe-declaration-merging
export interface APIClient {
  blbl: {
    getSong: (params?: object) => Promise<any>
    search: (params?: object) => Promise<any>
    getAudioOfVideo: (params?: object) => Promise<any>
    getVideoInfo: (params?: object) => Promise<any>
    getUserInfo: (params?: { mid: string | number }) => Promise<any>
    getFavInfo: (params?: object) => Promise<any>
    getCollectionInfo: (params?: object) => Promise<any>
    getSeriesInfo: (params?: object) => Promise<any>
  }
  biliMusic: {
    getMusicRank: (params: { list_id: number }) => Promise<any>
    getMusicRankList: () => Promise<any>
  }
}

// eslint-disable-next-line ts/no-unsafe-declaration-merging
export class APIClient {
  private readonly cache = new Map<string | symbol, any>()

  constructor() {
    // @ts-expect-error proxy instance
    return new Proxy({}, {
      get: (_, namespace) => {
        if (this.cache.has(namespace)) {
          return this.cache.get(namespace)
        }
        else {
          const api = new Proxy({}, {
            get(_, p) {
              return (options?: object) => {
                return apiProxy({
                  contentScriptQuery: p.toString(),
                  ...options,
                })
              }
            },
          })
          this.cache.set(namespace, api)
          return api
        }
      },
    })
  }
}

const api = new APIClient()

export function useApiClient() {
  return api
}
