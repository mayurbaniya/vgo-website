import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { getActiveOffers } from '@/lib/api'
import { PageHeader } from '@/components/vehicle-listing'
import { PRIMARY_CITY } from '@/lib/site'

export const metadata: Metadata = {
  title: `Bike & Scooter Offers in ${PRIMARY_CITY}`,
  description: `Current dealer offers, discounts and exchange bonuses on two-wheelers in ${PRIMARY_CITY}.`,
  alternates: { canonical: '/offers' },
}

export default function OffersPage() {
  return (
    <>
      <PageHeader
        title="Offers"
        description={`Live dealer offers and discounts across ${PRIMARY_CITY}.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<OffersSkeleton />}>
          <Offers />
        </Suspense>
      </div>
    </>
  )
}

async function Offers() {
  const offers = await getActiveOffers()

  if (offers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-ink-subtle">
        No offers are running right now. Check back soon.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <li
          key={offer.id}
          className="overflow-hidden rounded-xl border border-hairline bg-surface"
        >
          {offer.imageURL && (
            <div className="relative aspect-video bg-surface-alt">
              <Image
                src={offer.imageURL}
                alt={offer.title ?? 'Offer'}
                fill
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h2 className="font-semibold text-ink">{offer.title}</h2>
            {offer.description && (
              <p className="mt-1 text-sm text-ink-muted">{offer.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function OffersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-xl border border-hairline bg-surface-alt"
        />
      ))}
    </div>
  )
}
