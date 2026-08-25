import Link from 'next/link'
import type { IndexedVehicle } from '@/lib/catalog'
import {
  SORTS,
  activeFilterCount,
  appliedChips,
  clearHref,
  filterVehicles,
  pageHref,
  sortHref,
  sortVehicles,
  viewHref,
  type CatalogQuery,
  type GroupKey,
} from '@/lib/filters'
import type { Brand } from '@/lib/types'
import { Dropdown, DropdownItem } from './dropdown'
import { FilterGroups } from './filter-rail'
import { FilterSheet } from './filter-sheet'
import { EmptyState, VehicleGrid } from './vehicle-grid'

export const RESULTS_PER_PAGE = 24

/**
 * The faceted listing.
 *
 * One component behind /bikes, /scooters, /electric, /type/[slug],
 * /brands/[slug] and /search. Each route hands it a `pool` — its own subject,
 * already narrowed — and the user's filters apply on top of that. Which is why
 * the brand page can hide the brand filter and the electric page can hide the
 * fuel filter without either of them re-implementing a rail.
 *
 * Everything below renders on the server from the URL. There is no client-side
 * filter state to get out of step with the address bar, no flash of unfiltered
 * results, and a filtered listing is a link you can send someone.
 */
export function CatalogBrowser({
  pool,
  brands,
  today,
  query,
  basePath,
  hide = [],
  emptyMessage = 'No models match these filters.',
}: {
  pool: IndexedVehicle[]
  brands: Brand[]
  today: number
  query: CatalogQuery
  basePath: string
  hide?: GroupKey[]
  emptyMessage?: string
}) {
  const matched = sortVehicles(filterVehicles(pool, query), query.sort)

  const totalPages = Math.max(1, Math.ceil(matched.length / RESULTS_PER_PAGE))
  // A filter change can leave the URL pointing past the end of the results;
  // clamping is friendlier than an empty page that looks like a dead catalog.
  const page = Math.min(query.page, totalPages)
  const start = (page - 1) * RESULTS_PER_PAGE
  const visible = matched.slice(start, start + RESULTS_PER_PAGE)

  const active = activeFilterCount(query)
  const chips = appliedChips(basePath, query, (id) =>
    brands.find((brand) => brand.id === id)?.name,
  )

  const rail = (
    <FilterGroups
      pool={pool}
      query={query}
      basePath={basePath}
      brands={brands}
      hide={hide}
    />
  )

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      {/* Sticky below the header, so the rail stays reachable however far down
          a long result set you are. --header-h keeps that offset honest if the
          chrome ever changes height; see globals.css. */}
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+1rem)] max-h-[calc(100vh-var(--header-h)-2rem)] overflow-y-auto pr-2 pb-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="micro text-ink">Filters</h2>
            {active > 0 && (
              <Link
                href={clearHref(basePath, query)}
                scroll={false}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Clear all
              </Link>
            )}
          </div>
          {rail}
        </div>
      </aside>

      <div className="min-w-0">
        <Toolbar
          count={matched.length}
          page={page}
          totalPages={totalPages}
          query={query}
          basePath={basePath}
          active={active}
          rail={rail}
        />

        {chips.length > 0 && (
          <ul className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Link href={chip.href} scroll={false} className="chip chip-active">
                  {chip.label}
                  <span aria-hidden className="opacity-70">
                    ✕
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={clearHref(basePath, query)}
                scroll={false}
                className="px-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                Clear all
              </Link>
            </li>
          </ul>
        )}

        {visible.length === 0 ? (
          <EmptyState
            message={
              active > 0
                ? 'No models match every filter you picked.'
                : emptyMessage
            }
            action={
              active > 0 ? (
                <Link href={clearHref(basePath, query)} className="btn-ghost">
                  Clear filters
                </Link>
              ) : (
                <Link href="/bikes" className="btn-ghost">
                  Browse all models
                </Link>
              )
            }
          />
        ) : (
          <VehicleGrid vehicles={visible} today={today} view={query.view} />
        )}

        <Pagination
          basePath={basePath}
          query={query}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}

function Toolbar({
  count,
  page,
  totalPages,
  query,
  basePath,
  active,
  rail,
}: {
  count: number
  page: number
  totalPages: number
  query: CatalogQuery
  basePath: string
  active: number
  rail: React.ReactNode
}) {
  const currentSort = SORTS.find((sort) => sort.key === query.sort)

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
      <div className="flex items-center gap-3">
        <FilterSheet activeCount={active}>{rail}</FilterSheet>
        <p className="tnum text-sm text-ink-muted">
          <span className="font-semibold text-ink">{count}</span>{' '}
          {count === 1 ? 'model' : 'models'}
          {totalPages > 1 && (
            <span className="text-ink-subtle">
              {' '}
              · page {page} of {totalPages}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Dropdown label="Sort" value={currentSort?.label}>
          {SORTS.map((sort) => (
            <Link key={sort.key} href={sortHref(basePath, query, sort.key)} scroll={false}>
              <DropdownItem active={sort.key === query.sort}>{sort.label}</DropdownItem>
            </Link>
          ))}
        </Dropdown>

        <div className="seg hidden sm:flex">
          <Link
            href={viewHref(basePath, query, 'grid')}
            scroll={false}
            aria-label="Grid view"
            data-active={query.view === 'grid'}
            className="seg-item"
          >
            <GridIcon />
          </Link>
          <Link
            href={viewHref(basePath, query, 'list')}
            scroll={false}
            aria-label="List view"
            data-active={query.view === 'list'}
            className="seg-item"
          >
            <ListIcon />
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Numbered pages, as real links.
 *
 * Crawlers follow hrefs; they do not click "load more" buttons, and every
 * vehicle needs to sit behind a crawlable URL to get indexed at all. The window
 * around the current page keeps the control short on a long result set without
 * hiding the first and last pages, which are the two people jump to.
 */
function Pagination({
  basePath,
  query,
  page,
  totalPages,
}: {
  basePath: string
  query: CatalogQuery
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  const window = new Set<number>([1, totalPages, page])
  for (let offset = 1; offset <= 2; offset++) {
    if (page - offset > 0) window.add(page - offset)
    if (page + offset <= totalPages) window.add(page + offset)
  }
  const pages = [...window].sort((a, b) => a - b)

  const step = 'rounded-control border border-hairline px-3.5 py-2 text-sm font-medium transition-colors'

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={pageHref(basePath, query, page - 1)}
          rel="prev"
          className={`${step} text-ink-muted hover:border-ink/25 hover:text-ink`}
        >
          ← Previous
        </Link>
      ) : (
        <span className={`${step} text-ink-subtle opacity-40`}>← Previous</span>
      )}

      {pages.map((entry, i) => (
        <span key={entry} className="flex items-center gap-2">
          {i > 0 && entry - pages[i - 1] > 1 && (
            <span className="text-ink-subtle">…</span>
          )}
          {entry === page ? (
            <span
              aria-current="page"
              className={`${step} tnum border-ink bg-ink text-surface`}
            >
              {entry}
            </span>
          ) : (
            <Link
              href={pageHref(basePath, query, entry)}
              className={`${step} tnum text-ink-muted hover:border-ink/25 hover:text-ink`}
            >
              {entry}
            </Link>
          )}
        </span>
      ))}

      {page < totalPages ? (
        <Link
          href={pageHref(basePath, query, page + 1)}
          rel="next"
          className={`${step} text-ink-muted hover:border-ink/25 hover:text-ink`}
        >
          Next →
        </Link>
      ) : (
        <span className={`${step} text-ink-subtle opacity-40`}>Next →</span>
      )}
    </nav>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
      <rect x="2" y="3" width="12" height="3" rx="1" />
      <rect x="2" y="10" width="12" height="3" rx="1" />
    </svg>
  )
}
