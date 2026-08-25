import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogResults } from '@/components/catalog-results'
import { ListingSkeleton, PageHeader } from '@/components/vehicle-listing'
import { MARKET } from '@/lib/site'

export const metadata: Metadata = {
  title: `Scooters in ${MARKET} — Prices, Mileage and Specifications`,
  description: `Browse every scooter available in ${MARKET}, petrol and electric. Filter by budget, brand and displacement, and compare prices, mileage and specifications.`,
  alternates: { canonical: '/scooters' },
}

export default function ScootersPage(props: PageProps<'/scooters'>) {
  return (
    <>
      <PageHeader
        eyebrow="New scooters"
        title={`Scooters in ${MARKET}`}
        description="Petrol and electric scooters, with prices, specs and claimed mileage."
      />
      <div className="shell py-8">
        <Suspense fallback={<ListingSkeleton />}>
          <CatalogResults
            searchParams={props.searchParams}
            basePath="/scooters"
            restrict={(entry) => entry.bodySlug === 'scooter'}
            // Every row here is a scooter, so the body-style group would offer
            // five options that return nothing and one that changes nothing.
            hide={['body']}
            emptyMessage="No scooters are listed right now."
          />
        </Suspense>
      </div>
    </>
  )
}
