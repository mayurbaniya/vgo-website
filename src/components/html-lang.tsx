'use client'

import { useEffect } from 'react'

/**
 * Keeps `<html lang>` in step with the reader's chosen language.
 *
 * The attribute is written from the client rather than rendered, because the
 * language lives in a cookie and the `<html>` element is the one thing on the
 * page that cannot sit inside a `<Suspense>` boundary. Reading the cookie
 * where the element is declared would make the root layout dynamic and cost
 * every route its static shell — the exact trade `cacheComponents` exists to
 * avoid.
 *
 * So the shell ships `lang="en-IN"`, which is right for the default and right
 * for the crawlers that read it, and this corrects it for a Hindi reader once
 * their language has streamed in. It renders nothing.
 */
export function HtmlLangSync({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return null
}
