import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getAllScooters } from '@/lib/api'
import {
  ListingSkeleton,
  PAGE_SIZE,
  PageHeader,
  VehicleListing,
  parsePage,
} from '@/components/vehicle-listing'
import { PRIMARY_CITY } from '@/lib/site'

export const metadata: Metadata = {
  title: `Scooters in ${PRIMARY_CITY} — Prices, Mileage and Specifications`,
  description: `Browse every scooter available in ${PRIMARY_CITY}. Compare on-road prices, engine capacity, mileage and full specifications.`,
  alternates: { canonical: '/scooters' },
}

export default function ScootersPage(props: PageProps<'/scooters'>) {
  return (
    <>
      <PageHeader
        title={`Scooters in ${PRIMARY_CITY}`}
        description="Petrol and electric scooters, with prices, specs and claimed mileage."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<ListingSkeleton />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  )
}

async function Results({
  searchParams,
}: Pick<PageProps<'/scooters'>, 'searchParams'>) {
  const { page } = await searchParams
  const result = await getAllScooters(parsePage(page), PAGE_SIZE)

  return (
    <VehicleListing
      page={result}
      basePath="/scooters"
      emptyMessage="No scooters are listed right now."
    />
  )
}
