import { getUserAgent } from '~/lib/user-agent'
import { useAuth } from '~/stores/auth'

export const REDDIT_URI = 'https://www.reddit.com'
export const REDDIT_OLD_URI = 'https://old.reddit.com'

const POST_PERMALINK = /^\/(?:r|user)\/[^/]+\/comments\/([a-z0-9]+)(?:\/|$)/i

export async function recordPostVisit(
  permalink: string,
  postId: string,
  accountId: string,
) {
  if (useAuth.getState().accountId !== accountId) {
    return
  }

  const auth = getAuth()

  if (!auth) {
    return
  }

  const uri = new URL(permalink, REDDIT_URI)
  const match = POST_PERMALINK.exec(uri.pathname)

  // The session cookie must only be sent to Reddit's canonical post pages.
  if (
    uri.origin !== REDDIT_URI ||
    match?.[1]?.toLowerCase() !== postId.toLowerCase() ||
    uri.search ||
    uri.hash
  ) {
    return
  }

  const headers = new Headers()

  headers.set('accept', 'text/html')
  headers.set('cookie', `reddit_session=${auth.cookie}`)
  headers.set('user-agent', getUserAgent())

  await fetch(uri, {
    credentials: 'omit',
    headers,
    method: 'GET',
    redirect: 'error',
  })
}

type Props = {
  body?: URLSearchParams
  method?: 'get' | 'post'
  url: string | URL
}

export async function reddit<Response>({ body, method = 'get', url }: Props) {
  const auth = getAuth()

  if (!auth) {
    return
  }

  const headers = new Headers()

  headers.set('cookie', `reddit_session=${auth.cookie}`)
  headers.set('user-agent', getUserAgent())

  if (method === 'post') {
    headers.set('x-modhash', auth.modHash)
  }

  const request: RequestInit = {
    credentials: 'omit',
    headers,
    method,
    redirect: 'follow',
  }

  if (body) {
    request.body = body.toString()

    headers.set('content-type', 'application/x-www-form-urlencoded')
  }

  const uri = new URL(url, REDDIT_URI)

  if (
    method === 'get' &&
    !uri.pathname.startsWith('/api/') &&
    !uri.pathname.endsWith('.json')
  ) {
    uri.pathname += '.json'
  }

  uri.searchParams.set('raw_json', '1')

  if (__DEV__) {
    console.log('url', uri.toString())
  }

  const response = await fetch(uri, request)

  if (url === '/api/read_all_messages') {
    return {} as Response
  }

  const text = await response.text()

  let json: {
    explanation?: string
    message?: string
  }

  try {
    json = JSON.parse(text)
  } catch (error) {
    throw new Error(response.statusText, {
      cause: error,
    })
  }

  if (response.status >= 400) {
    throw new Error(json.explanation ?? json.message ?? response.statusText)
  }

  return json as Response
}

export function getAuth() {
  const { accountId, accounts } = useAuth.getState()

  if (!accountId) {
    return
  }

  const account = accounts.find((item) => item.id === accountId)

  if (!account) {
    return
  }

  return {
    cookie: account.cookie,
    modHash: account.modHash,
  }
}
