import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { searchVehicles } from '@/lib/api'
import {
  EmptyState,
  GridSkeleton,
  VehicleGrid,
} from '@/components/vehicle-grid'
import { SearchBox } from '@/components/search-box'
import { PageHeader } from '@/components/vehicle-listing'

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
        description="Find a model by name — Duke, Activa, Classic 350, Rizta."
      >
        <div className="mt-6 max-w-xl rounded-control bg-ground p-1.5">
          <SearchBox size="hero" autoFocus placeholder="Search a model…" />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* searchParams is runtime data, so the read happens inside the
            boundary — that keeps the header in the prerendered static shell. */}
        <Suspense fallback={<GridSkeleton count={3} />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  )
}

async function Results({
  searchParams,
}: Pick<PageProps<'/search'>, 'searchParams'>) {
  const { q } = await searchParams
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? ''

  if (!query) {
    return (
      <EmptyState
        message="Type a model name above to search the catalog."
        action={
          <Link
            href="/bikes"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Or browse all bikes →
          </Link>
        }
      />
    )
  }

  const vehicles = await searchVehicles(query)

  return (
    <>
      <p className="mb-6 text-sm text-ink-muted">
        {vehicles.length === 0
          ? 'No matches for '
          : `${vehicles.length} ${vehicles.length === 1 ? 'match' : 'matches'} for `}
        <span className="font-semibold text-ink">“{query}”</span>
      </p>

      <VehicleGrid
        vehicles={vehicles}
        emptyMessage="No model matches that name. Try a shorter search — “duke” rather than “KTM Duke 390 BS6”."
      />
    </>
  )
}
