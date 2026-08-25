import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCatalogSnapshot } from '@/lib/catalog'
import { EmptyState } from '@/components/vehicle-grid'
import { PageHeader } from '@/components/vehicle-listing'
import { brandMonogram, brandSlug, compactInr } from '@/lib/format'
import { MARKET } from '@/lib/site'

export const metadata: Metadata = {
  title: `Two-Wheeler Brands in ${MARKET}`,
  description: `Every bike and scooter brand available in ${MARKET}, with how many models each one sells and where its range starts.`,
  alternates: { canonical: '/brands' },
}

export default function BrandsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Manufacturers"
        title="Brands"
        description="Every manufacturer we track, with the size of its range and where its pricing starts."
      />
      <div className="shell py-8">
        <Suspense fallback={<BrandsSkeleton />}>
          <AllBrands />
        </Suspense>
      </div>
    </>
  )
}

/**
 * A brand index, not a logo wall.
 *
 * The old page rendered a name and a mark, which told a reader nothing they did
 * not already know — everyone recognises Honda. Model count and entry price are
 * the two facts that make one of these tiles worth clicking, and both come free
 * from the catalog index.
 */
async function AllBrands() {
  const snapshot = await getCatalogSnapshot()

  const rows = snapshot.brands
    .filter((brand) => brand.id != null && brand.name)
    .map((brand) => {
      const models = snapshot.vehicles.filter((entry) => entry.brandId === brand.id)
      const prices = models
        .map((entry) => entry.priceMin)
        .filter((price): price is number => price !== null)

      return {
        brand,
        count: models.length,
        from: prices.length > 0 ? Math.min(...prices) : null,
      }
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        (b.brand.rating ?? 0) - (a.brand.rating ?? 0) ||
        a.brand.name!.localeCompare(b.brand.name!),
    )

  if (rows.length === 0) {
    return <EmptyState message="No brands are listed right now." />
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {rows.map(({ brand, count, from }) => (
        <li key={brand.id}>
          <Link
            href={`/brands/${brandSlug(brand.name!, brand.id!)}`}
            className="card card-interactive group flex h-full flex-col p-5"
          >
            <span className="relative flex h-12 w-full items-center justify-center">
              {brand.imageURL ? (
                <Image
                  src={brand.imageURL}
                  alt={brand.name!}
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              ) : (
                <span className="display-sm flex size-12 items-center justify-center rounded-chip bg-ground text-base text-ground-ink">
                  {brandMonogram(brand.name)}
                </span>
              )}
            </span>

            <span className="display-sm mt-4 text-center text-sm text-ink">
              {brand.name}
            </span>

            <span className="micro tnum mt-1 text-center text-ink-subtle">
              {count} {count === 1 ? 'model' : 'models'}
            </span>

            {from !== null && (
              <span className="mt-4 border-t border-hairline pt-3 text-center">
                <span className="micro block text-ink-subtle">From</span>
                <span className="figure text-sm text-ink">{compactInr(from)}</span>
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function BrandsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="shimmer h-44 rounded-card" />
      ))}
    </div>
  )
}
