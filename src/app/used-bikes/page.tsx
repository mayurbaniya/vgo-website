import type { Metadata } from 'next'
import Link from 'next/link'
import { GetAppButton } from '@/components/get-app-button'
import { PageHeader } from '@/components/vehicle-listing'
import { SITE_NAME } from '@/lib/site'

/**
 * Used bikes — not built.
 *
 * The nav and the footer link here because the section is planned, and a link
 * that goes nowhere is worse than a page that explains itself. What this page
 * must not do is imply inventory: there is no used listing anywhere in the API
 * or the admin panel, and a grid of placeholder cards would read as stock we do
 * not have.
 *
 * Kept out of the index — an empty section competing for "used bikes" queries
 * would earn a bounce and teach a search engine that this site answers that
 * question badly.
 */
export const metadata: Metadata = {
  title: 'Used Bikes',
  description: 'Used two-wheeler listings are not live on VGO yet.',
  robots: { index: false, follow: true },
}

export default function UsedBikesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Not live yet"
        title="Used bikes"
        description="We do not list used two-wheelers yet — and would rather say so than show you an empty marketplace."
      />

      <div className="shell py-12">
        <div className="max-w-3xl">
          <h2 className="display-sm text-lg text-ink">Why it is not here</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">
            A used listing needs three things VGO does not have yet: sellers,
            inspection, and a way to tell a real advert from a fake one. Every
            one of those is a product, not a page. Standing up a grid of
            second-hand bikes without them would put you in front of listings
            nobody has checked, which is precisely the problem used marketplaces
            exist to solve.
          </p>

          <h2 className="display-sm mt-8 text-lg text-ink">What works today</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">
            Everything about new two-wheelers: ex-showroom prices and full
            specifications for the whole catalog, an itemised on-road estimate
            for twelve cities, an EMI calculator, side-by-side comparison, and
            live dealer offers. If you are cross-shopping a used bike against a
            new one, the on-road estimator is the number you want to compare
            against.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/bikes" className="btn-primary">
              Browse new bikes
            </Link>
            <Link href="/on-road-price" className="btn-ghost">
              Estimate on-road price
            </Link>
            <GetAppButton label={`Get the ${SITE_NAME} app on Google Play`} />
          </div>
        </div>
      </div>
    </>
  )
}
