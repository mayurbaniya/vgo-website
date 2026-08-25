import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogResults } from '@/components/catalog-results'
import { SearchBox } from '@/components/search-box'
import { ListingSkeleton, PageHeader } from '@/components/vehicle-listing'

/**
 * Results pages are deliberately kept out of the index: they are thin,
 * infinitely many, and compete with the listing pages that are meant to rank.
 */
export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
}

export default function SearchPage(props: PageProps<'/search'>) {
  return (
    <>
      <PageHeader
        title="Search"
        description="Find a model by name — Duke, Activa, Classic 350, Rizta — then narrow it down."
      >
        <div className="mt-6 max-w-xl">
          <SearchBox size="hero" autoFocus placeholder="Search a model…" />
        </div>
      </PageHeader>

      <div className="shell py-8">
        <Suspense fallback={<ListingSkeleton />}>
          {/*
            Results come from the catalog index rather than from the backend's
            /vehicles/search endpoint. That endpoint matches names and returns a
            flat list — which is fine until you want to then filter those
            matches by budget or brand, which is exactly what someone does after
            searching "pulsar" and getting six of them. One source for the rows
            means the rail, the counts and the sort all work here identically to
            every other listing.
          */}
          <CatalogResults
            searchParams={props.searchParams}
            basePath="/search"
            emptyMessage="Type a model name above to search the catalog."
          />
        </Suspense>
      </div>
    </>
  )
}
