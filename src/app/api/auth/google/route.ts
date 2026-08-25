import { NextResponse } from 'next/server'
import { SESSION_COOKIES } from '@/lib/session'

/**
 * Exchanges a Firebase ID token for a session on this origin.
 *
 * The browser posts the credential here rather than to the backend directly,
 * so the resulting cookies belong to the site instead of to the API domain —
 * see the note in lib/session.ts for why that distinction decides whether the
 * session survives a navigation in production.
 *
 * The backend does the account decision: `/user/auth/google-sign-in` looks the
 * email up and either signs the existing user in or creates one on the spot.
 * There is no separate registration call to make, which is the whole reason
 * Google-only sign-in collapses into a single button.
 */

const BASE = process.env.API_BASE_URL?.replace(/\/+$/, '') ?? ''

type BackendUser = {
  name?: string
  email?: string
  accessToken?: string
}

export async function POST(request: Request) {
  if (!BASE) {
    console.error('[auth] API_BASE_URL is not set')
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  let body: { idToken?: string; email?: string; name?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  if (!body.idToken || !body.email) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  // The `/web` platform segment is what makes the backend answer with a
  // cookie-style session instead of putting the refresh token in the body.
  const upstream = await fetch(`${BASE}/user/auth/google-sign-in/web`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      idToken: body.idToken,
      email: body.email,
      name: body.name ?? undefined,
    }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  if (!upstream.ok) {
    console.error(`[auth] backend returned ${upstream.status}`)
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 })
  }

  const payload = (await upstream.json()) as {
    status?: string
    msg?: string
    data?: BackendUser
  }

  // Aliased before the guard rather than after it: narrowing
  // `payload.data?.accessToken` does not carry over to a copy taken
  // afterwards, and the token would still read as possibly-undefined where it
  // is written to a cookie below.
  const user = payload.data

  // This backend answers 200 with a status in the envelope, so a failed
  // sign-in looks like a successful HTTP call and has to be read out of the
  // body. `msg` stays in the server log and is not forwarded: on the failure
  // paths it distinguishes "account exists with email/password" from "invalid
  // token", which would tell an attacker which emails are registered.
  if (payload.status !== 'SUCCESS' || !user?.accessToken) {
    console.warn(`[auth] sign-in refused: status=${payload.status} msg=${payload.msg}`)
    return NextResponse.json({ error: 'sign_in_failed' }, { status: 401 })
  }

  const response = NextResponse.json({
    user: { name: user.name ?? body.name ?? body.email, email: user.email ?? body.email },
  })

  const secure = process.env.NODE_ENV === 'production'
  const base = { httpOnly: true, sameSite: 'lax', path: '/', secure } as const

  // Matches app.jwt-expiration-milliseconds (1h). Kept a minute short so the
  // cookie is gone slightly before the token it holds stops being accepted.
  response.cookies.set(SESSION_COOKIES.accessToken, user.accessToken, {
    ...base,
    maxAge: 59 * 60,
  })

  // The backend sets its own refresh_token cookie for its own domain, which
  // this origin can neither read later nor send back. Lift it out of the
  // Set-Cookie header now and re-issue it here, so a future refresh route has
  // something to present.
  const refreshToken = readSetCookie(upstream.headers, 'refresh_token')
  if (refreshToken) {
    response.cookies.set(SESSION_COOKIES.refreshToken, refreshToken, {
      ...base,
      maxAge: 7 * 24 * 60 * 60,
    })
  }

  response.cookies.set(
    SESSION_COOKIES.user,
    JSON.stringify({
      name: user.name ?? body.name ?? body.email,
      email: user.email ?? body.email,
    }),
    { ...base, maxAge: 7 * 24 * 60 * 60 },
  )

  return response
}

/**
 * Pulls one cookie value out of an upstream Set-Cookie header.
 *
 * `getSetCookie()` returns every header line separately, which matters because
 * a plain `get('set-cookie')` folds them into one comma-joined string that
 * cannot be split safely — cookie Expires attributes contain commas.
 */
function readSetCookie(headers: Headers, name: string): string | null {
  for (const line of headers.getSetCookie()) {
    const [pair] = line.split(';')
    const separator = pair.indexOf('=')
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim() || null
    }
  }
  return null
}
