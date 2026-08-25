import { cookies } from 'next/headers'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  isLanguage,
  type LanguageCode,
} from './dictionaries'

/**
 * The reader's chosen language, from the cookie the switcher writes.
 *
 * MUST be called inside a `<Suspense>` boundary. `cookies()` is a request-time
 * API: under Cache Components, reading it outside a boundary stops the route
 * being prerendered at all, and this is used from the root layout — so getting
 * that wrong would cost every page on the site its static shell, which is the
 * whole reason `cacheComponents` is switched on in next.config.ts.
 *
 * The pattern to follow is the one already used for the nav's active marker:
 * render the English default as the Suspense fallback so it lands in the
 * static shell, and let the reader's actual language stream in over it.
 *
 * Equally: never call this inside a `use cache` function. A cached scope has
 * no request to read a cookie from, and if it could, the first visitor's
 * language would be served to everyone. Where cached output does need to
 * differ by language — the footer, for instance — resolve the language out
 * here and pass it in as an argument, which makes it part of the cache key.
 */
export async function getLanguage(): Promise<LanguageCode> {
  const store = await cookies()
  const value = store.get(LANGUAGE_COOKIE)?.value
  return isLanguage(value) ? value : DEFAULT_LANGUAGE
}
