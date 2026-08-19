import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getVehiclesByBodyType } from '@/lib/api'
import { GridSkeleton } from '@/components/vehicle-grid'
import {
  PAGE_SIZE,
  PageHeader,
  VehicleListing,
  parsePage,
} from '@/components/vehicle-listing'
import { PRIMARY_CITY, bodyTypeBySlug } from '@/lib/site'

/*
 * No generateStaticParams — same reasoning as the other dynamic routes: it
 * would couple every deploy to the backend being up. The body-type list is
 * static in code, so these five URLs are still fully crawlable via the footer
 * and the home page tiles.
 */

export async function generateMetadata({
  params,
}: PageProps<'/type/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const type = bodyTypeBySlug(slug)
  if (!type) return { title: 'Not found' }

  return {
    title: `${type.label} Bikes in ${PRIMARY_CITY} — Prices & Specifications`,
    description: `Every ${type.label.toLowerCase()} two-wheeler available in ${PRIMARY_CITY}, with on-road prices, engine specs and claimed mileage.`,
    alternates: { canonical: `/type/${type.slug}` },
  }
}

/**
 * Deliberately not async: awaiting `params` here would read runtime data
 * outside a Suspense boundary and cost the route its static shell.
 */
export default function BodyTypePage(props: PageProps<'/type/[slug]'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Content params={props.params} searchParams={props.searchParams} />
    </Suspense>
  )
}

async function Content({ params, searchParams }: PageProps<'/type/[slug]'>) {
  const { slug } = await params
  const type = bodyTypeBySlug(slug)
  if (!type) notFound()

  const { page } = await searchParams
  const result = await getVehiclesByBodyType(
    type.code,
    parsePage(page),
    PAGE_SIZE,
  )

  return (
    <>
      <PageHeader
        eyebrow={type.blurb}
        title={`${type.label} bikes in ${PRIMARY_CITY}`}
        description={`Every ${type.label.toLowerCase()} model we track, with prices, engine specs and claimed mileage.`}
        count={result?.totalElements}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <VehicleListing
          page={result}
          basePath={`/type/${type.slug}`}
          emptyMessage={`No ${type.label.toLowerCase()} models are listed right now.`}
        />
      </div>
    </>
  )
}

function Skeleton() {
  return (
    <>
      <PageHeader title="Loading" description="Fetching the catalog." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <GridSkeleton />
      </div>
    </>
  )
}
