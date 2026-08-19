import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getElectricVehicles } from '@/lib/api'
import {
  ListingSkeleton,
  PAGE_SIZE,
  PageHeader,
  VehicleListing,
  parsePage,
} from '@/components/vehicle-listing'
import { PRIMARY_CITY } from '@/lib/site'

export const metadata: Metadata = {
  title: `Electric Bikes & Scooters in ${PRIMARY_CITY} — Range, Battery, Price`,
  description: `Every electric two-wheeler available in ${PRIMARY_CITY}. Compare certified range, battery capacity, charging time and on-road price.`,
  alternates: { canonical: '/electric' },
}

export default function ElectricPage(props: PageProps<'/electric'>) {
  return (
    <>
      <PageHeader
        title={`Electric vehicles in ${PRIMARY_CITY}`}
        description="EV two-wheelers with certified range, battery capacity and charging times."
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
}: Pick<PageProps<'/electric'>, 'searchParams'>) {
  const { page } = await searchParams
  const result = await getElectricVehicles(parsePage(page), PAGE_SIZE)

  return (
    <VehicleListing
      page={result}
      basePath="/electric"
      emptyMessage="No electric vehicles are listed right now."
    />
  )
}
