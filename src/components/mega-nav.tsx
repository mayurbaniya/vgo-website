'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { NAV_LINKS } from '@/lib/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'

export type NavKey = (typeof NAV_LINKS)[number]['key']

/**
 * The primary nav, with drop-down panels.
 *
 * A flat row of six links is the single clearest signal that a catalog site was
 * built as a demo — every portal in this category opens the catalog from the
 * nav instead, because "Bikes" is not a destination, it is a question with four
 * or five useful answers (by budget, by engine, by style, what's new).
 *
 * The panels are server-rendered and arrive as props. This component owns
 * nothing but which one is open, so no catalog data or formatting ships to the
 * browser to support them. Links without a panel behave exactly as they did.
 */
export function MegaNav({
  pathname,
  dict,
  panels,
}: {
  pathname: string | null
  dict: Dictionary
  panels: Partial<Record<NavKey, React.ReactNode>>
}) {
  /**
   * Which panel is open, and the route it was opened on.
   *
   * The pathname is stored alongside the key rather than watched in an effect:
   * a panel left open across a navigation would cover the page you just asked
   * for, and clearing it in an effect means React renders the covered page once
   * before the effect fires. Deriving `open` from the pair closes it in the
   * same render as the route change.
   */
  const [opened, setOpened] = useState<{ key: NavKey; at: string | null } | null>(
    null,
  )
  const open = opened !== null && opened.at === pathname ? opened.key : null

  const setOpen = (key: NavKey | null) =>
    setOpened(key === null ? null : { key, at: pathname })

  const rootRef = useRef<HTMLDivElement>(null)
  // Closing on pointer-out immediately makes the panel impossible to reach:
  // the cursor crosses a gap between the trigger and the panel below it.
  const closeTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // setOpened, not setOpen: the latter closes over `pathname` and would
      // make this listener re-bind on every navigation for no benefit.
      if (event.key === 'Escape') setOpened(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  function scheduleClose() {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpened(null), 140)
  }

  function cancelClose() {
    window.clearTimeout(closeTimer.current)
  }

  // Prefix match, so a vehicle page opened from /bikes keeps Bikes lit — the
  // marker answers "where am I in the catalog", which a strict equality check
  // would get wrong on every detail page.
  const isActive = (href: string) =>
    pathname !== null && (pathname === href || pathname.startsWith(`${href}/`))

  return (
    <div
      ref={rootRef}
      className="hidden md:block"
      onPointerLeave={scheduleClose}
      onPointerEnter={cancelClose}
    >
      <nav aria-label={dict.nav.primary} className="flex items-center gap-0.5">
        {NAV_LINKS.map((link) => {
          const panel = panels[link.key]
          const active = isActive(link.href)
          const expanded = open === link.key

          return (
            <div key={link.href} className="relative">
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                aria-expanded={panel ? expanded : undefined}
                onPointerEnter={() => panel && setOpen(link.key)}
                onFocus={() => panel && setOpen(link.key)}
                className={`relative flex items-center gap-1 rounded-chip px-3 py-2 text-sm font-medium transition-colors ${
                  active || expanded
                    ? 'text-ground-ink'
                    : 'text-ground-muted hover:text-ground-ink'
                }`}
              >
                {dict.nav[link.key]}
                {panel && (
                  <span
                    aria-hidden
                    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  >
                    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
                    </svg>
                  </span>
                )}
                {/* The signal colour marks position — the one place it appears
                    in the chrome. */}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-signal" />
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {open && panels[open] && (
        <div
          // Full-bleed under the bar rather than anchored to the trigger: the
          // panels hold four columns, and a menu that narrow would wrap them
          // into an unreadable stack.
          className="absolute inset-x-0 top-full z-40 pt-2"
          onPointerEnter={cancelClose}
        >
          <div className="shell">
            <div className="mega p-6">{panels[open]}</div>
          </div>
        </div>
      )}
    </div>
  )
}
