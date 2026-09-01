import { NextResponse } from 'next/server'
import { SESSION_COOKIES, getAccessToken } from '@/lib/session'

const BASE = process.env.API_BASE_URL?.replace(/\/+$/, '') ?? ''

/**
 * Web counterpart to the app's Settings → Delete Account
 * (UserService.deleteAccount in vehicle_) — hits the same
 * DELETE /user/account endpoint with the same bearer token this site already
 * holds for a signed-in reader. This is the live account-deletion request
 * Google Play's Data Safety "account deletion" link points at.
 */
export async function POST() {
  if (!BASE) {
    console.error('[account] API_BASE_URL is not set')
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const upstream = await fetch(`${BASE}/user/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  const payload = (await upstream.json().catch(() => null)) as {
    status?: string
    msg?: string
  } | null

  if (!upstream.ok || payload?.status !== 'SUCCESS') {
    console.error(`[account] delete failed: ${upstream.status} ${payload?.msg ?? ''}`)
    return NextResponse.json(
      { error: payload?.msg ?? 'delete_failed' },
      { status: upstream.status >= 400 ? upstream.status : 502 },
    )
  }

  // The account is gone — clear the session the same way logout does, so the
  // header reflects it on the refresh the caller triggers next.
  const response = NextResponse.json({ ok: true })
  for (const name of Object.values(SESSION_COOKIES)) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  return response
}
