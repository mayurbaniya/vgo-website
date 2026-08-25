'use client'

import { usePathname } from 'next/navigation'
import { NavLinks } from './site-nav'
import { MegaNav, type NavKey } from './mega-nav'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Adds the current-section marker to the nav.
 *
 * Must always be rendered inside a <Suspense> boundary whose fallback is a
 * plain <NavLinks pathname={null} />: usePathname suspends during the App Shell
 * prerender of any route with dynamic params, and without the boundary the
 * whole layout — every page's shell — turns dynamic.
 *
 * `panels` arrives as already-rendered server markup and is only handed
 * onwards, so the mega-menu's contents never enter the client bundle.
 */
export function ActiveNav({
  variant,
  dict,
  panels,
}: {
  variant: 'bar' | 'strip'
  dict: Dictionary
  panels?: Partial<Record<NavKey, React.ReactNode>>
}) {
  const pathname = usePathname()

  if (variant === 'bar') {
    return <MegaNav pathname={pathname} dict={dict} panels={panels ?? {}} />
  }

  return <NavLinks variant="strip" pathname={pathname} dict={dict} />
}
