import Link from 'next/link'
import { cacheLife } from 'next/cache'
import { BODY_TYPES, NAV_LINKS, PLAY_STORE_URL, PRIMARY_CITY } from '@/lib/site'
import { Wordmark } from './site-header'

/**
 * Cached rather than plain, because of the copyright year.
 *
 * Under Cache Components, reading the current clock during prerender is an
 * error — the value would be frozen into the static shell with no lifetime.
 * `use cache` + a day-long life is the sanctioned fix: everyone sees the same
 * year, and it refreshes on its own instead of going stale until the next
 * deploy.
 */
export async function SiteFooter() {
  'use cache'
  cacheLife('days')

  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 bg-ground text-ground-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark className="text-2xl" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Prices, specifications and dealer offers for every bike and scooter
            sold in {PRIMARY_CITY}.
          </p>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-control bg-white/10 px-4 py-2 text-sm font-semibold text-ground-ink transition-colors hover:bg-white/16"
          >
            Get the app
          </a>
        </div>

        <FooterColumn title="Browse" links={NAV_LINKS.map((l) => ({ ...l }))} />

        <FooterColumn
          title="By body type"
          links={BODY_TYPES.map((type) => ({
            href: `/type/${type.slug}`,
            label: type.label,
          }))}
        />

        <FooterColumn
          title="Company"
          links={[
            { href: '/privacy-policy', label: 'Privacy policy' },
            { href: '/brands', label: 'All brands' },
            { href: '/news', label: 'News' },
          ]}
        />
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs">
          <p>© {year} VGO Pvt Ltd · Nagpur, Maharashtra, India</p>
          <p className="micro text-white/30">Prices are indicative · {PRIMARY_CITY}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h2 className="micro text-white/40">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ground-muted transition-colors hover:text-ground-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
