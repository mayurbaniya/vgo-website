import Link from 'next/link'
import { NAV_LINKS } from '@/lib/site'
import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * The nav markup, with no hooks in it.
 *
 * Kept free of `usePathname` on purpose: under Cache Components a client hook
 * that reads the route suspends while Next generates the App Shell for any
 * route with dynamic params, so reading it in the root layout would cost every
 * page its static shell. This renders from a passed-in pathname instead, which
 * lets it serve two jobs — the prerendered fallback (pathname = null, no
 * marker, but every link present for crawlers) and the streamed-in version
 * that knows where you are. See site-nav-active.tsx.
 *
 * The dictionary arrives the same way and for the same reason: the reader's
 * language lives in a cookie, and reading a cookie outside a Suspense boundary
 * would take the static shell with it. The fallback renders English into the
 * shell; the reader's language streams over it.
 */
export function NavLinks({
  variant,
  pathname,
  dict,
}: {
  variant: 'bar' | 'strip'
  pathname: string | null
  dict: Dictionary
}) {
  // Prefix match, so a vehicle page opened from /bikes keeps Bikes lit — the
  // marker answers "where am I in the catalog", which a strict equality check
  // would get wrong on every detail page.
  const isActive = (href: string) =>
    pathname !== null && (pathname === href || pathname.startsWith(`${href}/`))

  if (variant === 'strip') {
    return (
      <nav
        aria-label={dict.nav.primaryMobile}
        className="shell-bleed flex gap-1 overflow-x-auto border-t border-white/8 py-2 md:hidden"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            className={`whitespace-nowrap rounded-chip px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive(link.href)
                ? 'bg-white/12 text-ground-ink'
                : 'text-ground-muted hover:text-ground-ink'
            }`}
          >
            {dict.nav[link.key]}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav aria-label={dict.nav.primary} className="hidden items-center gap-0.5 md:flex">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          className={`relative rounded-chip px-3 py-2 text-sm font-medium transition-colors ${
            isActive(link.href)
              ? 'text-ground-ink'
              : 'text-ground-muted hover:text-ground-ink'
          }`}
        >
          {dict.nav[link.key]}
          {/* The signal colour marks position — the one place it appears in
              the chrome. */}
          {isActive(link.href) && (
            <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-signal" />
          )}
        </Link>
      ))}
    </nav>
  )
}
