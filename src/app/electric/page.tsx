import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogResults } from '@/components/catalog-results'
import { ListingSkeleton, PageHeader } from '@/components/vehicle-listing'
import { MARKET } from '@/lib/site'

export const metadata: Metadata = {
  title: `Electric Bikes & Scooters in ${MARKET} — Range, Battery, Price`,
  description: `Every electric two-wheeler available in ${MARKET}. Compare certified range, battery capacity, charging time and price, and filter by budget and brand.`,
  alternates: { canonical: '/electric' },
}

export default function ElectricPage(props: PageProps<'/electric'>) {
  return (
    <>
      <PageHeader
        eyebrow="Zero fuel bills"
        title={`Electric two-wheelers in ${MARKET}`}
        description="EVs with certified range, battery capacity and charging times — and no road tax in most states."
      />
      <div className="shell py-8">
        <Suspense fallback={<ListingSkeleton />}>
          <CatalogResults
            searchParams={props.searchParams}
            basePath="/electric"
            restrict={(entry) => entry.ev}
            hide={['fuel']}
            emptyMessage="No electric vehicles are listed right now."
          />
        </Suspense>
      </div>
    </>
  )
}
