import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogResults } from '@/components/catalog-results'
import { ListingSkeleton, PageHeader } from '@/components/vehicle-listing'
import { MARKET } from '@/lib/site'

export const metadata: Metadata = {
  title: `Bikes in ${MARKET} — Prices, Mileage and Specifications`,
  description: `Browse every motorcycle available in ${MARKET}. Filter by budget, brand, displacement and body style, and compare ex-showroom prices, mileage and full specifications.`,
  // The canonical is the unfiltered listing. Every filter combination is a
  // valid page to land on and share, but they are the same catalog sliced
  // differently and should not compete with each other in an index.
  alternates: { canonical: '/bikes' },
}

export default function BikesPage(props: PageProps<'/bikes'>) {
  return (
    <>
      <PageHeader
        eyebrow="New bikes"
        title={`Bikes in ${MARKET}`}
        description="Every motorcycle we track, with prices, engine specs and claimed mileage. Narrow by budget, brand, displacement or body style."
      />
      <div className="shell py-8">
        <Suspense fallback={<ListingSkeleton />}>
          <CatalogResults
            searchParams={props.searchParams}
            basePath="/bikes"
            // Scooters have their own door at /scooters. This reproduces what
            // the backend's /vehicles/bikes endpoint returns, from the index.
            restrict={(entry) => entry.bodySlug !== 'scooter'}
            emptyMessage="No bikes are listed right now."
          />
        </Suspense>
      </div>
    </>
  )
}
