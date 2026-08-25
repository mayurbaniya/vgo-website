import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCities } from '@/lib/api'
import { getCatalogSnapshot } from '@/lib/catalog'
import { ModelPicker, type PickableModel } from '@/components/model-picker'
import { PageHeader } from '@/components/vehicle-listing'
import { cityLabel, motorKilowatts } from '@/lib/pricing'
import { MARKET, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'On-Road Price Estimator',
  description: `Estimate the on-road price of any bike or scooter in ${MARKET}. Adds state road tax, insurance and registration to the ex-showroom price, itemised.`,
  alternates: { canonical: '/on-road-price' },
}

export default function OnRoadPricePage() {
  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="On-road price estimator"
        description="Ex-showroom is not what you pay. This adds state road tax, insurance and registration — itemised, so you can see where each rupee goes."
      />

      <div className="shell py-8">
        <Suspense fallback={<div className="shimmer h-96 rounded-card" />}>
          <Estimator />
        </Suspense>

        <section className="mt-12 max-w-3xl">
          <h2 className="display-sm text-base text-ink">
            What this is, and what it is not
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            It is arithmetic. Road tax on a two-wheeler is a state slab applied
            to the ex-showroom price, which is why the same bike costs several
            thousand rupees more in one state than another. Insurance uses the
            third-party premium IRDAI sets for the vehicle&apos;s engine capacity
            — or motor output, on an EV — plus a working figure for own-damage
            cover. Registration and dealer handling are close enough to flat
            across cities to be treated as such.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            It is not a quote, and VGO has no dealer feed behind it. A real
            invoice will differ: dealers add accessories, extended warranty and
            logistics, manufacturer offers come off, and a few states run
            surcharges this does not model. Treat the number as the right
            ballpark to walk into a showroom with, then ask them for the
            breakdown — and check{' '}
            <Link href="/offers" className="font-semibold text-brand-700 hover:underline">
              current offers
            </Link>{' '}
            before you do.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
            Most states waive road tax on electric two-wheelers, which is why an
            EV&apos;s on-road figure sits much closer to its ex-showroom price.
            Slabs change; if one here looks stale for your state, it probably is.
          </p>
        </section>
      </div>
    </>
  )
}

async function Estimator() {
  const [snapshot, cities] = await Promise.all([getCatalogSnapshot(), getCities()])

  const usableCities = cities
    .filter((city) => city.id != null && city.name && city.status !== 99)
    .map((city) => ({ id: city.id!, name: city.name! }))

  const models: PickableModel[] = snapshot.vehicles
    .filter((entry) => entry.priceMin !== null)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      price: entry.priceMin!,
      ev: entry.ev,
      cc: entry.cc,
      kw: motorKilowatts(entry.vehicle.motorPower),
    }))

  if (models.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-hairline p-10 text-center text-sm text-ink-subtle">
        The catalog is unavailable right now, so there is nothing to price. Try
        again shortly.
      </p>
    )
  }

  return (
    <>
      {usableCities.length === 1 && (
        <p className="mb-5 text-sm text-ink-muted">
          Prices are shown for{' '}
          <span className="font-semibold text-ink">
            {cityLabel(usableCities[0].name)}
          </span>
          , the city {SITE_NAME} currently covers. More cities appear here as
          they are added.
        </p>
      )}
      <ModelPicker models={models} tool="on-road" cities={usableCities} />
    </>
  )
}
