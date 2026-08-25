import { cookies } from 'next/headers'

/**
 * The signed-in reader, as the server sees them.
 *
 * <h2>Why the site keeps its own cookies</h2>
 * The backend's `/user/auth/google-sign-in/web` sets a `refresh_token` cookie
 * itself — but it sets it for the *API's* domain. In development that happens
 * to work, because localhost:9999 and localhost:3000 share a host and cookies
 * ignore the port. In production, with the API on one hostname and the site on
 * another, a SameSite=Lax cookie set by the API is simply not sent on requests
 * to the site, and the session would appear to vanish on the first navigation.
 *
 * So the browser never talks to the backend for auth at all. It posts to
 * /api/auth/google on this origin, the Next server makes the call, and the
 * session lands in cookies belonging to *this* site. That is the same shape as
 * the rest of the data layer, where the browser also never sees the API.
 *
 * Every cookie here is httpOnly, including the display name. Nothing about the
 * session is readable from JavaScript, so an injected script cannot lift the
 * access token, and the header reads the name server-side inside the same
 * Suspense boundary it already needs for the language.
 */

export const SESSION_COOKIES = {
  /** Backend JWT. One hour, per app.jwt-expiration-milliseconds. */
  accessToken: 'vgo_at',
  /** Backend refresh token, lifted out of its Set-Cookie header. */
  refreshToken: 'vgo_rt',
  /** Display identity: name and email, JSON. */
  user: 'vgo_user',
} as const

export type SessionUser = {
  name: string
  email: string
}

/**
 * MUST be called inside a `<Suspense>` boundary, for the same reason as
 * `getLanguage`: `cookies()` is a request-time API, and reading it outside a
 * boundary under Cache Components stops the route being prerendered. The
 * header renders a signed-out fallback into the static shell and streams the
 * real state over it.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIES.user)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>
    if (!parsed?.email) return null
    return { name: parsed.name || parsed.email, email: parsed.email }
  } catch {
    // A malformed cookie is a signed-out reader, not a 500. Someone hand-edited
    // it, or the shape changed across a deploy.
    return null
  }
}

/** The backend JWT, for calls that need to act as the reader. */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIES.accessToken)?.value ?? null
}
