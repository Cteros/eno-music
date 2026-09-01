type FetchAfterHandler = ((data: Response) => Promise<any>) | ((data: any) => any)

function toJsonHandler(data: Response): Promise<any> {
  return data.json()
}

function toData(data: Promise<any>): Promise<any> {
  return data
}

function sendResponseHandler(sendResponse: any) {
  return (data: any) => sendResponse(data)
}

const AHS: {
  J: FetchAfterHandler[]
  J_D: FetchAfterHandler[]
  J_S: FetchAfterHandler[]
  S: FetchAfterHandler[]
} = {
  J: [toJsonHandler],
  J_D: [toJsonHandler, toData],
  J_S: [toJsonHandler, sendResponseHandler],
  S: [sendResponseHandler],
}

interface Message {
  contentScriptQuery: string
  [key: string]: any
}

interface FetchOption {
  method: string
  headers?: {
    [key: string]: any
  }
  body?: any
}

interface Endpoint {
  url: string
  _fetch: FetchOption
  params?: {
    [key: string]: any
  }
  afterHandle: ((response: Response) => Response | Promise<Response>)[]
}

type EndpointFunction = (message: Message, sender?: any, sendResponse?: any) => any
type EndpointType = Endpoint | EndpointFunction
interface EndpointMap {
  [key: string]: EndpointType
}

function createApiProxy(API_MAP: EndpointMap) {
  return (message: Message, sender?: any, sendResponse?: any) => {
    const contentScriptQuery = message.contentScriptQuery
    if (!contentScriptQuery || !API_MAP[contentScriptQuery])
      return console.error(`Cannot find this contentScriptQuery: ${contentScriptQuery}`)
    if (API_MAP[contentScriptQuery] instanceof Function)
      return (API_MAP[contentScriptQuery] as EndpointFunction)(message, sender, sendResponse)

    try {
      let { contentScriptQuery, ...rest } = message
      rest = rest || {}

      let { _fetch, url, params = {}, afterHandle } = API_MAP[contentScriptQuery] as Endpoint
      const { method, headers, body } = _fetch as FetchOption
      const isGET = method.toLocaleLowerCase() === 'get'
      const targetParams = Object.assign({}, params)
      let targetBody = Object.assign({}, body)
      Object.keys(rest).forEach((key) => {
        if (body && body[key] !== undefined)
          targetBody[key] = rest[key]
        else
          targetParams[key] = rest[key]
      })

      if (Object.keys(targetParams).length) {
        const urlParams = new URLSearchParams()
        for (const key in targetParams) {
          if (targetParams[key])
            urlParams.append(key, targetParams[key])
        }

        url += `?${urlParams.toString()}`
      }
      if (!isGET) {
        targetBody = (headers && headers['Content-Type'] && headers['Content-Type'].includes('application/x-www-form-urlencoded'))
          ? new URLSearchParams(targetBody)
          : JSON.stringify(targetBody)
      }
      const fetchOpt = { method, headers }
      if (!isGET) {
        Object.assign(fetchOpt, { body: targetBody })
      }

      let baseFunc = fetch(url, fetchOpt)
      afterHandle.forEach((func) => {
        if (func.name === sendResponseHandler.name && sendResponse)
          baseFunc = baseFunc.then(sendResponseHandler(sendResponse))
        else
          baseFunc = baseFunc.then(func)
      })
      baseFunc.catch(console.error)
      return baseFunc
    }
    catch (e) {
      console.error(e)
    }
  }
}

export {
  AHS,
  createApiProxy,
}
