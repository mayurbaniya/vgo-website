import { NextResponse } from 'next/server'
import { SESSION_COOKIES } from '@/lib/session'

/**
 * Ends the session.
 *
 * The site's own cookies are cleared unconditionally, and only then does it
 * try to revoke the refresh token upstream. That order is deliberate: if the
 * backend is unreachable, the reader is still signed out here rather than
 * stuck with a Log out button that does nothing. The token left alive upstream
 * expires on its own.
 */

const BASE = process.env.API_BASE_URL?.replace(/\/+$/, '') ?? ''

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const refreshToken = readCookie(cookieHeader, SESSION_COOKIES.refreshToken)

  const response = NextResponse.json({ ok: true })
  for (const name of Object.values(SESSION_COOKIES)) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }

  if (BASE && refreshToken) {
    try {
      // The backend reads its own `refresh_token` cookie name, so present it
      // under that name rather than the one this site stores it under.
      await fetch(`${BASE}/user/auth/logout/web`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${refreshToken}` },
        signal: AbortSignal.timeout(5_000),
        cache: 'no-store',
      })
    } catch (error) {
      console.warn('[auth] upstream logout failed, session cleared locally:', error)
    }
  }

  return response
}

function readCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator > 0 && part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim()) || null
    }
  }
  return null
}
