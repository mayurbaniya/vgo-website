/**
 * The compare shortlist.
 *
 * Which models you are weighing up is a preference, not catalog data, so it
 * lives in localStorage rather than in a cookie or an account: it must survive a
 * reload, must not be sent to the server on every request, and must work for the
 * signed-out reader, who is most of the traffic.
 *
 * The tray and every compare toggle on the page are separate React trees with no
 * common ancestor — the toggles are inside cached card markup, the tray is
 * mounted once in the layout. A DOM event is what keeps them in step: a write
 * broadcasts, everyone re-reads. `storage` covers the same in a second tab, but
 * it deliberately does not fire in the tab that wrote, which is why there are
 * two channels rather than one.
 */

export const COMPARE_KEY = 'vgo-compare'
export const COMPARE_EVENT = 'vgo-compare-change'

/**
 * Four columns is where a comparison table stops fitting a laptop screen
 * without either scrolling sideways or shrinking the type past reading size.
 */
export const COMPARE_MAX = 4

/** The URL a shortlist opens at. Ids are the same ones the API uses. */
export function compareHref(ids: number[]): string {
  return ids.length > 0 ? `/compare?v=${ids.join(',')}` : '/compare'
}

/** Parses `?v=13,14,5`, dropping anything malformed rather than throwing. */
export function parseCompareIds(raw: string | string[] | undefined): number[] {
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? ''
  const seen = new Set<number>()

  for (const part of value.split(',')) {
    const id = Number.parseInt(part.trim(), 10)
    if (Number.isSafeInteger(id) && id > 0) seen.add(id)
  }

  return [...seen].slice(0, COMPARE_MAX)
}

export function readCompare(): number[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(COMPARE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((id): id is number => Number.isSafeInteger(id) && id > 0)
      .slice(0, COMPARE_MAX)
  } catch {
    // Private-mode Safari throws on localStorage, and a hand-edited value can
    // fail to parse. Neither is worth breaking the page over — the shortlist
    // just starts empty.
    return []
  }
}

export function writeCompare(ids: number[]): void {
  if (typeof window === 'undefined') return

  const next = ids.slice(0, COMPARE_MAX)
  try {
    window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next))
  } catch {
    // Ignore — the in-page event below still keeps this tab consistent.
  }
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT, { detail: next }))
}

/**
 * Adds or removes an id.
 *
 * Returns `'full'` when the shortlist is already at COMPARE_MAX and the id is
 * not in it, so the caller can say why nothing happened instead of silently
 * ignoring the click.
 */
export function toggleCompare(id: number): number[] | 'full' {
  const current = readCompare()

  if (current.includes(id)) {
    const next = current.filter((entry) => entry !== id)
    writeCompare(next)
    return next
  }

  if (current.length >= COMPARE_MAX) return 'full'

  const next = [...current, id]
  writeCompare(next)
  return next
}
