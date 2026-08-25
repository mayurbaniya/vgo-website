import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getActiveOffers } from '@/lib/api'
import { getCatalogSnapshot } from '@/lib/catalog'
import { OfferCard } from '@/components/offer-card'
import { EmptyState } from '@/components/vehicle-grid'
import { PageHeader } from '@/components/vehicle-listing'
import { MARKET } from '@/lib/site'
import type { Brand } from '@/lib/types'

export const metadata: Metadata = {
  title: `Bike & Scooter Offers in ${MARKET}`,
  description: `Current dealer offers, discounts and exchange bonuses on two-wheelers in ${MARKET}, with the terms attached to each one.`,
  alternates: { canonical: '/offers' },
}

export default function OffersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Running now"
        title="Offers and discounts"
        description={`Live dealer benefits across ${MARKET}. Terms are attached to every offer — read them before you count on the number.`}
      />
      <div className="shell py-8">
        <Suspense fallback={<OffersSkeleton />}>
          <Offers />
        </Suspense>
      </div>
    </>
  )
}

/**
 * Offers, grouped by what they apply to.
 *
 * The API scopes an offer three ways — one model, one brand, or everything —
 * and the difference matters more than any of the copy on the card: "₹3,000
 * off" means something quite different if it only applies to one scooter.
 * Grouping states the scope once per section instead of leaving it implied.
 */
async function Offers() {
  const [offers, snapshot] = await Promise.all([
    getActiveOffers(),
    getCatalogSnapshot(),
  ])

  if (offers.length === 0) {
    return (
      <EmptyState message="No offers are running right now. Dealer benefits change month to month — check back at the start of the next one." />
    )
  }

  const brandName = (id?: number) =>
    snapshot.brands.find((brand: Brand) => brand.id === id)?.name

  const groups = [
    {
      title: 'Across the catalog',
      description: 'Offers that are not tied to one brand or model.',
      rows: offers.filter((offer) => !offer.brandId && !offer.vehicleId),
    },
    {
      title: 'Brand offers',
      description: 'Running across a manufacturer’s range.',
      rows: offers.filter((offer) => offer.brandId && !offer.vehicleId),
    },
    {
      title: 'Model offers',
      description: 'Tied to a single model.',
      rows: offers.filter((offer) => offer.vehicleId),
    },
  ].filter((group) => group.rows.length > 0)

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.title}>
          <div className="mb-5">
            <h2 className="display text-xl text-ink sm:text-2xl">{group.title}</h2>
            <p className="mt-1.5 text-sm text-ink-muted">{group.description}</p>
          </div>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.rows.map((offer) => {
              const scope =
                brandName(offer.brandId) ??
                snapshot.vehicles.find((entry) => entry.id === offer.vehicleId)?.title

              return (
                <li key={offer.id}>
                  {scope && <p className="micro mb-2 text-ink-subtle">{scope}</p>}
                  <OfferCard offer={offer} expanded />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function OffersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="shimmer h-72 rounded-card" />
      ))}
    </div>
  )
}
