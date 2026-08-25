import type { Metadata } from 'next'
import Link from 'next/link'
import { GetAppButton } from '@/components/get-app-button'
import { PageHeader } from '@/components/vehicle-listing'
import { SITE_NAME } from '@/lib/site'

/**
 * Showrooms — not built. Same reasoning as /used-bikes: the link exists in the
 * footer because the section is planned, and there is no dealer table anywhere
 * in the API to populate it from. Noindex for the same reason.
 */
export const metadata: Metadata = {
  title: 'Showrooms',
  description: 'Dealer and showroom listings are not live on VGO yet.',
  robots: { index: false, follow: true },
}

export default function ShowroomsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Not live yet"
        title="Showrooms"
        description="We do not hold a dealer network yet. Connecting with a showroom happens in the app."
      />

      <div className="shell py-12">
        <div className="max-w-3xl">
          <h2 className="display-sm text-lg text-ink">Why it is not here</h2>
          <p className="mt-3 leading-relaxed text-ink-muted">
            A showroom finder is only useful if the addresses, phone numbers and
            opening hours are right, and keeping that true means a relationship
            with every dealer on the list. VGO has that conversation running
            through the app, where an enquiry reaches a real person, rather than
            through a directory page that would go stale the first time a
            dealership moved.
          </p>

          <h2 className="display-sm mt-8 text-lg text-ink">
            Talking to a dealer today
          </h2>
          <p className="mt-3 leading-relaxed text-ink-muted">
            Shortlist the model you want in the {SITE_NAME} app and mark
            interest — that is what reaches a showroom. Before you do, the
            on-road estimator gives you the figure to hold them to, and the
            offers page shows what is currently running on that brand.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <GetAppButton label={`Get the ${SITE_NAME} app on Google Play`} />
            <Link href="/offers" className="btn-ghost">
              See current offers
            </Link>
            <Link href="/on-road-price" className="btn-ghost">
              Estimate on-road price
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
