import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { CatalogResults } from '@/components/catalog-results'
import { ListingSkeleton, PageHeader } from '@/components/vehicle-listing'
import { MARKET, bodyTypeBySlug } from '@/lib/site'

/*
 * No generateStaticParams — same reasoning as the other dynamic routes: it
 * would couple every deploy to the backend being up. The body-type list is
 * static in code, so these five URLs stay fully crawlable via the footer, the
 * header's mega-menu and the home page's browse block.
 */

export async function generateMetadata({
  params,
}: PageProps<'/type/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const type = bodyTypeBySlug(slug)
  if (!type) return { title: 'Not found' }

  return {
    title: `${type.label} Bikes in ${MARKET} — Prices & Specifications`,
    description: `Every ${type.label.toLowerCase()} two-wheeler available in ${MARKET}, with ex-showroom prices, engine specs and claimed mileage.`,
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

  return (
    <>
      <PageHeader
        eyebrow={type.blurb}
        title={`${type.label} bikes in ${MARKET}`}
        description={`Every ${type.label.toLowerCase()} model we track, with prices, engine specs and claimed mileage.`}
        breadcrumbs={[
          { href: '/', label: 'Home' },
          { href: '/bikes', label: 'Bikes' },
        ]}
      />
      <div className="shell py-8">
        <CatalogResults
          searchParams={searchParams}
          basePath={`/type/${type.slug}`}
          restrict={(entry) => entry.bodySlug === type.slug}
          // The route is the body style, so offering it again as a filter would
          // only let a reader contradict the page they are on.
          hide={['body']}
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
      <div className="shell py-8">
        <ListingSkeleton />
      </div>
    </>
  )
}
