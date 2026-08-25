import Link from 'next/link'
import type { IndexedVehicle } from '@/lib/catalog'
import {
  BODY_FILTERS,
  BUDGET_BUCKETS,
  CC_BUCKETS,
  FEATURE_FILTERS,
  FUEL_FILTERS,
  facetCount,
  isActive,
  toggleHref,
  type CatalogQuery,
  type GroupKey,
} from '@/lib/filters'
import type { Brand } from '@/lib/types'

/**
 * The filter rail.
 *
 * Every option is an `<a href>` carrying the URL that results from ticking it,
 * not a checkbox wired to a handler. That is what makes a filtered listing
 * shareable, back-buttonable and crawlable, and it means the rail works with
 * JavaScript disabled — the same trade vehicle-listing.tsx already makes for
 * pagination.
 *
 * Groups are `<details>` for the same reason: open/closed is a browser
 * behaviour here, not React state, so it costs nothing and never desyncs.
 *
 * Counts beside each option are computed with that option's own group excluded
 * from the predicate (see `facetCount`). Without that, ticking "Honda" would
 * show "Honda 3, Bajaj 0" — every other brand zeroed out by the filter you just
 * applied — which reads as a broken index rather than a narrowed one.
 */
export function FilterGroups({
  pool,
  query,
  basePath,
  brands,
  hide = [],
}: {
  /** The route's subject before any user filter — scooters only, brand X, … */
  pool: IndexedVehicle[]
  query: CatalogQuery
  basePath: string
  brands: Brand[]
  /** Groups the route already fixes, so offering them would be a no-op. */
  hide?: GroupKey[]
}) {
  const show = (group: GroupKey) => !hide.includes(group)

  // Brands the current pool actually contains. Listing all 60-odd rows of a
  // brands table on a page that holds four of them is the fastest way to make a
  // filter rail feel like a database dump.
  const presentBrandIds = new Set(
    pool.map((entry) => entry.brandId).filter((id): id is number => id !== null),
  )
  const usableBrands = brands
    .filter((brand) => brand.id != null && brand.name && presentBrandIds.has(brand.id))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name!.localeCompare(b.name!))

  return (
    <div className="divide-y divide-hairline">
      {show('budget') && (
        <Group title="Budget" defaultOpen>
          <Options
            pool={pool}
            query={query}
            basePath={basePath}
            group="budget"
            options={BUDGET_BUCKETS}
          />
        </Group>
      )}

      {show('brand') && usableBrands.length > 1 && (
        <Group title="Brand" defaultOpen>
          <Options
            pool={pool}
            query={query}
            basePath={basePath}
            group="brand"
            options={usableBrands.map((brand) => ({
              key: String(brand.id),
              label: brand.name!,
            }))}
          />
        </Group>
      )}

      {show('cc') && (
        <Group title="Displacement">
          <Options
            pool={pool}
            query={query}
            basePath={basePath}
            group="cc"
            options={CC_BUCKETS}
          />
        </Group>
      )}

      {show('body') && (
        <Group title="Body style">
          <Options
            pool={pool}
            query={query}
            basePath={basePath}
            group="body"
            options={BODY_FILTERS}
          />
        </Group>
      )}

      {show('fuel') && (
        <Group title="Fuel">
          <Options
            pool={pool}
            query={query}
            basePath={basePath}
            group="fuel"
            options={FUEL_FILTERS}
          />
        </Group>
      )}

      {show('features') && (
        <Group title="Features">
          <Options
            pool={pool}
            query={query}
            basePath={basePath}
            group="features"
            options={FEATURE_FILTERS}
          />
        </Group>
      )}
    </div>
  )
}

function Group({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} className="group py-4 first:pt-0 last:pb-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1">
        <span className="micro text-ink">{title}</span>
        <span
          aria-hidden
          className="text-ink-subtle transition-transform duration-200 group-open:rotate-180"
        >
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
          </svg>
        </span>
      </summary>
      <ul className="mt-3 space-y-1">{children}</ul>
    </details>
  )
}

function Options({
  pool,
  query,
  basePath,
  group,
  options,
}: {
  pool: IndexedVehicle[]
  query: CatalogQuery
  basePath: string
  group: GroupKey
  options: { key: string; label: string }[]
}) {
  return (
    <>
      {options.map((option) => {
        const active = isActive(query, group, option.key)
        const count = facetCount(pool, query, group, option.key)

        // An option that leads nowhere stops being a link. Greyed-out rather
        // than hidden, because a rail whose options appear and disappear as you
        // tick things is disorienting — you lose track of what you ruled out.
        if (count === 0 && !active) {
          return (
            <li key={option.key}>
              <span className="flex items-center justify-between gap-2 rounded-chip px-2 py-1.5 text-sm text-ink-subtle opacity-40">
                <span className="flex items-center gap-2">
                  <Box checked={false} />
                  {option.label}
                </span>
                <span className="tnum text-xs">0</span>
              </span>
            </li>
          )
        }

        return (
          <li key={option.key}>
            <Link
              href={toggleHref(basePath, query, group, option.key)}
              aria-pressed={active}
              scroll={false}
              className={`flex items-center justify-between gap-2 rounded-chip px-2 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-brand-50 font-semibold text-brand-700'
                  : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-2">
                <Box checked={active} />
                {option.label}
              </span>
              <span className="tnum text-xs text-ink-subtle">{count}</span>
            </Link>
          </li>
        )
      })}
    </>
  )
}

/** A checkbox glyph, not a checkbox — the control is the link around it. */
function Box({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-hairline'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2.5 6.2 2.4 2.4 4.6-5" />
        </svg>
      )}
    </span>
  )
}
