import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getBrands } from '@/lib/api'
import { BrandStrip } from '@/components/brand-strip'
import { PageHeader } from '@/components/vehicle-listing'
import { PRIMARY_CITY } from '@/lib/site'

export const metadata: Metadata = {
  title: `Two-Wheeler Brands in ${PRIMARY_CITY}`,
  description: `Every bike and scooter brand available in ${PRIMARY_CITY}, with prices and full model line-ups.`,
  alternates: { canonical: '/brands' },
}

export default function BrandsPage() {
  return (
    <>
      <PageHeader
        title="Brands"
        description="Browse every manufacturer we track, and their full model line-up."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<BrandsSkeleton />}>
          <AllBrands />
        </Suspense>
      </div>
    </>
  )
}

async function AllBrands() {
  const brands = await getBrands()

  if (brands.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-ink-subtle">
        No brands are listed right now.
      </p>
    )
  }

  return <BrandStrip brands={brands} />
}

function BrandsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl border border-hairline bg-surface-alt"
        />
      ))}
    </div>
  )
}
