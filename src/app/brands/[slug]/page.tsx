import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getBrands, getVehiclesByBrand } from '@/lib/api'
import {
  ListingSkeleton,
  PAGE_SIZE,
  PageHeader,
  VehicleListing,
  parsePage,
} from '@/components/vehicle-listing'
import { brandSlug, idFromSlug } from '@/lib/format'
import { PRIMARY_CITY } from '@/lib/site'

/*
 * No generateStaticParams here on purpose.
 *
 * Under Cache Components it must return at least one entry or the build fails,
 * which would make every Vercel deploy hard-depend on the single backend
 * instance being reachable at build time. Instead each brand URL is served the
 * App Shell on first hit and upgraded in the background (ISR), so deploys stay
 * decoupled from backend uptime and new brands appear without a redeploy.
 *
 * There is no SEO cost: Next.js detects crawlers and renders the full document
 * at request time rather than serving them the shell.
 */

/**
 * Brand slugs carry their id in the tail (`hero-4`), same convention as
 * vehicles. The name is resolved from the brands list so headings show real
 * casing rather than a de-slugified guess.
 */
async function resolveBrand(slugPromise: Promise<{ slug: string }>) {
  const { slug } = await slugPromise
  const id = idFromSlug(slug)
  if (id === null) return null

  const brands = await getBrands()
  return brands.find((b) => b.id === id) ?? null
}

export async function generateMetadata({
  params,
}: PageProps<'/brands/[slug]'>): Promise<Metadata> {
  const brand = await resolveBrand(params)
  if (!brand?.name) return { title: 'Brand not found' }

  return {
    title: `${brand.name} Bikes & Scooters in ${PRIMARY_CITY} — Prices and Specs`,
    description: `All ${brand.name} two-wheelers available in ${PRIMARY_CITY}, with on-road prices, mileage and full specifications.`,
  }
}

/**
 * Not async, and it never awaits params itself — that is what lets the route
 * keep a prerendered static shell even for brands that were not known at build
 * time. All param-dependent work happens inside the boundary below.
 */
export default function BrandPage(props: PageProps<'/brands/[slug]'>) {
  return (
    <Suspense fallback={<BrandSkeleton />}>
      <BrandContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  )
}

async function BrandContent({
  params,
  searchParams,
}: PageProps<'/brands/[slug]'>) {
  const brand = await resolveBrand(params)
  if (!brand?.id || !brand.name) notFound()

  const { page } = await searchParams
  const result = await getVehiclesByBrand(brand.id, parsePage(page), PAGE_SIZE)

  return (
    <>
      <PageHeader
        title={`${brand.name} bikes & scooters`}
        description={`Every ${brand.name} model available in ${PRIMARY_CITY}, with prices and specifications.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <VehicleListing
          page={result}
          basePath={`/brands/${brandSlug(brand.name, brand.id)}`}
          emptyMessage={`No ${brand.name} vehicles are listed right now.`}
        />
      </div>
    </>
  )
}

function BrandSkeleton() {
  return (
    <>
      <div className="border-b border-hairline bg-surface-alt">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-9 w-72 animate-pulse rounded bg-hairline" />
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-hairline" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ListingSkeleton />
      </div>
    </>
  )
}
