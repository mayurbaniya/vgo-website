import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getAllBikes } from '@/lib/api'
import {
  ListingSkeleton,
  PAGE_SIZE,
  PageHeader,
  VehicleListing,
  parsePage,
} from '@/components/vehicle-listing'
import { PRIMARY_CITY } from '@/lib/site'

export const metadata: Metadata = {
  title: `Bikes in ${PRIMARY_CITY} — Prices, Mileage and Specifications`,
  description: `Browse every motorcycle available in ${PRIMARY_CITY}. Compare on-road prices, engine capacity, mileage and full specifications.`,
  alternates: { canonical: '/bikes' },
}

export default function BikesPage(props: PageProps<'/bikes'>) {
  return (
    <>
      <PageHeader
        title={`Bikes in ${PRIMARY_CITY}`}
        description="Every motorcycle we track, with prices, engine specs and claimed mileage."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/*
          searchParams is runtime data, so the read happens inside the boundary
          — that keeps the header and chrome in the prerendered static shell.
        */}
        <Suspense fallback={<ListingSkeleton />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  )
}

async function Results({
  searchParams,
}: Pick<PageProps<'/bikes'>, 'searchParams'>) {
  const { page } = await searchParams
  const result = await getAllBikes(parsePage(page), PAGE_SIZE)

  return (
    <VehicleListing
      page={result}
      basePath="/bikes"
      emptyMessage="No bikes are listed right now."
    />
  )
}
