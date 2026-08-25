import { getCatalogSnapshot, type IndexedVehicle } from '@/lib/catalog'
import { parseQuery, type GroupKey } from '@/lib/filters'
import { CatalogBrowser } from './catalog-browser'

/**
 * The async half of every listing route.
 *
 * Each route is the same three lines — await the params, narrow the catalog to
 * the route's subject, hand both to the browser — so they live here once. What
 * a route still supplies is what actually differs: which rows are its subject,
 * which filter groups that makes redundant, and what to say when nothing
 * matches.
 *
 * `searchParams` is awaited inside this component rather than in the page, and
 * the page must render it inside a <Suspense> boundary. Reading runtime data
 * higher up would cost the route its prerendered shell, which on a catalog
 * built for search traffic is the whole point of the setup.
 */
export async function CatalogResults({
  searchParams,
  basePath,
  restrict,
  hide,
  emptyMessage,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  basePath: string
  /** The route's own constraint, applied before any filter the reader picks. */
  restrict?: (entry: IndexedVehicle) => boolean
  hide?: GroupKey[]
  emptyMessage?: string
}) {
  const [params, snapshot] = await Promise.all([
    searchParams,
    getCatalogSnapshot(),
  ])

  const query = parseQuery(params)
  const pool = restrict ? snapshot.vehicles.filter(restrict) : snapshot.vehicles

  return (
    <CatalogBrowser
      pool={pool}
      brands={snapshot.brands}
      today={snapshot.today}
      query={query}
      basePath={basePath}
      hide={hide}
      emptyMessage={emptyMessage}
    />
  )
}
