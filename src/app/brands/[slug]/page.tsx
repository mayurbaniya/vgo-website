import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getBrands } from '@/lib/api'
import { CatalogResults } from '@/components/catalog-results'
import { ListingSkeleton, PageHeader } from '@/components/vehicle-listing'
import { brandMonogram, brandSlug, idFromSlug } from '@/lib/format'
import { MARKET } from '@/lib/site'

/*
 * No generateStaticParams here on purpose.
 *
 * Under Cache Components it must return at least one entry or the build fails,
 * which would make every deploy hard-depend on the single backend instance
 * being reachable at build time. Instead each brand URL is served the App Shell
 * on first hit and upgraded in the background (ISR), so deploys stay decoupled
 * from backend uptime and new brands appear without a redeploy.
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
  if (!brand?.name || brand.id == null) return { title: 'Brand not found' }

  return {
    title: `${brand.name} Bikes & Scooters in ${MARKET} — Prices and Specs`,
    description: `All ${brand.name} two-wheelers available in ${MARKET}, with ex-showroom prices, mileage and full specifications.`,
    alternates: { canonical: `/brands/${brandSlug(brand.name, brand.id)}` },
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

  const basePath = `/brands/${brandSlug(brand.name, brand.id)}`

  return (
    <>
      <PageHeader
        title={`${brand.name} bikes & scooters`}
        description={`Every ${brand.name} model available in ${MARKET}, with prices and specifications.`}
        breadcrumbs={[
          { href: '/', label: 'Home' },
          { href: '/brands', label: 'Brands' },
        ]}
      >
        {/* The mark, on the dark ground where the brand grid also shows it.
            A brand page with no logo on it reads as a search result page. */}
        <div className="mt-6 flex size-16 items-center justify-center rounded-card border border-white/10 bg-white/95 p-2">
          {brand.imageURL ? (
            <span className="relative size-full">
              <Image
                src={brand.imageURL}
                alt={brand.name}
                fill
                sizes="64px"
                className="object-contain"
              />
            </span>
          ) : (
            <span className="display-sm text-lg text-ink">
              {brandMonogram(brand.name)}
            </span>
          )}
        </div>
      </PageHeader>

      <div className="shell py-8">
        <CatalogResults
          searchParams={searchParams}
          basePath={basePath}
          restrict={(entry) => entry.brandId === brand.id}
          // Every row is this brand; the group would be a single option that
          // either changes nothing or empties the page.
          hide={['brand']}
          emptyMessage={`No ${brand.name} vehicles are listed right now.`}
        />
      </div>
    </>
  )
}

function BrandSkeleton() {
  return (
    <>
      <div className="bg-ground">
        <div className="shell py-10 sm:py-12">
          <div className="h-3 w-40 rounded bg-white/10" />
          <div className="mt-5 h-10 w-80 max-w-full rounded bg-white/10" />
          <div className="mt-3 h-5 w-96 max-w-full rounded bg-white/[0.07]" />
          <div className="mt-6 size-16 rounded-card bg-white/10" />
        </div>
      </div>
      <div className="shell py-8">
        <ListingSkeleton />
      </div>
    </>
  )
}
