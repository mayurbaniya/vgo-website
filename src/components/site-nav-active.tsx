'use client'

import { usePathname } from 'next/navigation'
import { NavLinks } from './site-nav'

/**
 * Adds the current-section marker to the nav.
 *
 * Must always be rendered inside a <Suspense> boundary whose fallback is a
 * plain <NavLinks pathname={null} />: usePathname suspends during the App
 * Shell prerender of any route with dynamic params, and without the boundary
 * the whole layout — every page's shell — turns dynamic.
 */
export function ActiveNav({ variant }: { variant: 'bar' | 'strip' }) {
  return <NavLinks variant={variant} pathname={usePathname()} />
}
