'use server'

import { cookies } from 'next/headers'
import { LANGUAGE_COOKIE, isLanguage, type LanguageCode } from './dictionaries'

/**
 * Persists the reader's language choice.
 *
 * Not httpOnly: this is a display preference, not a credential, and keeping it
 * readable lets client code check the current language without a round trip.
 * A year of `maxAge` because the choice should outlive the session — someone
 * who reads Hindi still reads Hindi next month.
 *
 * The caller is expected to `router.refresh()` afterwards. The cookie is what
 * the streamed chrome reads, so without a refresh the page keeps the language
 * it was rendered with and the switcher appears to do nothing.
 */
export async function setLanguage(language: LanguageCode) {
  if (!isLanguage(language)) return

  const store = await cookies()
  store.set(LANGUAGE_COOKIE, language, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
