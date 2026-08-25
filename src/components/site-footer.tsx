import Link from 'next/link'
import { getBrands } from '@/lib/api'
import { getToday } from '@/lib/catalog'
import { BUDGET_BUCKETS, CC_BUCKETS } from '@/lib/filters'
import { brandSlug } from '@/lib/format'
import { BODY_TYPES, NAV_LINKS } from '@/lib/site'
import { GetAppButton } from './get-app-button'
import { Wordmark } from './wordmark'
import { fill, getDictionary, type LanguageCode } from '@/lib/i18n/dictionaries'

/**
 * The footer.
 *
 * Deliberately dense. On a catalog site the footer is not decoration — it is
 * the index: a crawler that lands on any page finds every budget band, every
 * displacement band, every body style and every brand from here, and so does a
 * reader who scrolled to the bottom without finding what they wanted. Twelve
 * links do not do that job; the portals run sixty and they are right to.
 *
 * No longer a `use cache` component. It was cached for one reason — the
 * copyright year, which cannot be read from the clock during prerender — and
 * that now comes from `getToday()`, which is itself cached with a day-long
 * life. Dropping the boundary is what lets this read the brand list: caching a
 * component that fetches would also cache the empty list `getBrands` degrades
 * to when the backend is down, and pin an empty brands column for a day after
 * it recovered.
 */
export async function SiteFooter({ language }: { language: LanguageCode }) {
  const dict = getDictionary(language)

  const [today, brands] = await Promise.all([getToday(), getBrands()])
  const year = new Date(today).getUTCFullYear()

  const popularBrands = brands
    .filter((brand) => brand.id != null && brand.name)
    .sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name!.localeCompare(b.name!),
    )
    .slice(0, 8)

  return (
    <footer className="mt-20 bg-ground text-ground-muted">
      <div className="shell-bleed py-14">
        <div className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
          <div>
            <Wordmark className="text-2xl" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              {dict.footer.tagline}
            </p>
            <GetAppButton tone="light" label={dict.header.getApp} className="mt-5" />
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <FooterColumn
              title={dict.footer.browse}
              links={[
                ...NAV_LINKS.map((link) => ({
                  href: link.href,
                  label: dict.nav[link.key],
                })),
              ]}
            />

            <FooterColumn
              title={dict.footer.byBudget}
              links={BUDGET_BUCKETS.map((bucket) => ({
                href: `/bikes?budget=${bucket.key}`,
                label: bucket.label,
              }))}
            />

            <FooterColumn
              title={dict.footer.byEngine}
              links={CC_BUCKETS.map((bucket) => ({
                href: `/bikes?cc=${bucket.key}`,
                label: bucket.label,
              }))}
            />

            <div className="space-y-10">
              <FooterColumn
                title={dict.footer.byBodyType}
                links={BODY_TYPES.map((type) => ({
                  href: `/type/${type.slug}`,
                  label: dict.bodyTypes[type.key],
                }))}
              />

              <FooterColumn
                title={dict.tools.label}
                links={[
                  { href: '/compare', label: dict.tools.compare },
                  { href: '/emi-calculator', label: dict.tools.emi },
                  { href: '/on-road-price', label: dict.tools.onRoad },
                  { href: '/used-bikes', label: dict.tools.usedBikes },
                  { href: '/showrooms', label: dict.tools.showrooms },
                ]}
              />
            </div>
          </div>
        </div>

        {popularBrands.length > 0 && (
          <div className="mt-12 border-t border-white/8 pt-8">
            <h2 className="micro text-white/40">{dict.footer.popularBrands}</h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {popularBrands.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/brands/${brandSlug(brand.name!, brand.id!)}`}
                    className="text-sm transition-colors hover:text-ground-ink"
                  >
                    {brand.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/brands"
                  className="text-sm font-semibold text-ground-ink hover:underline"
                >
                  {dict.footer.allBrands} →
                </Link>
              </li>
            </ul>
          </div>
        )}

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-white/35">
          {dict.footer.disclaimer}
        </p>
      </div>

      <div className="border-t border-white/8">
        <div className="shell-bleed flex flex-wrap items-center justify-between gap-3 py-6 text-xs">
          <p>{fill(dict.footer.rights, { year })}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="transition-colors hover:text-ground-ink">
              {dict.footer.privacyPolicy}
            </Link>
            <span className="micro text-white/30">{dict.footer.indicative}</span>
          </div>
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
