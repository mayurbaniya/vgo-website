/**
 * The listing query model: URL in, filtered rows out.
 *
 * Everything the browser can narrow by lives here as data — bucket bounds,
 * labels, URL keys, the predicate each group applies. The rail, the mobile
 * sheet, the applied-chip row and the sitemap's facet hubs all read the same
 * arrays, so adding a filter is one entry in one list rather than four edits
 * that drift apart.
 *
 * State lives entirely in the URL. That is not a stylistic choice: a filtered
 * listing has to be linkable, shareable and crawlable, and every control below
 * therefore renders as an `<a href>` that a browser with no JavaScript can
 * still follow — the same reasoning vehicle-listing.tsx already applies to
 * pagination.
 */
import type { IndexedVehicle } from './catalog'
import { BODY_TYPES } from './site'

export type SortKey =
  | 'popular'
  | 'price-low'
  | 'price-high'
  | 'newest'
  | 'mileage'
  | 'cc'

export const DEFAULT_SORT: SortKey = 'popular'

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popularity' },
  { key: 'price-low', label: 'Price — low to high' },
  { key: 'price-high', label: 'Price — high to low' },
  { key: 'newest', label: 'Newest first' },
  { key: 'mileage', label: 'Mileage' },
  { key: 'cc', label: 'Displacement' },
]

function isSortKey(value: string | undefined): value is SortKey {
  return SORTS.some((sort) => sort.key === value)
}

/** A numeric band. `max` of null means "and above". */
export interface Bucket {
  key: string
  label: string
  min: number
  max: number | null
}

/**
 * Budget bands.
 *
 * Bounds follow the tiers every Indian two-wheeler shopper already reads on
 * BikeWale and BikeDekho rather than being fitted to the current catalog —
 * a band that moves when a vehicle is added would make yesterday's shared link
 * mean something different today.
 */
export const BUDGET_BUCKETS: Bucket[] = [
  { key: 'under-80k', label: 'Under ₹80,000', min: 0, max: 80_000 },
  { key: '80k-100k', label: '₹80,000 – ₹1 lakh', min: 80_000, max: 100_000 },
  { key: '100k-150k', label: '₹1 – 1.5 lakh', min: 100_000, max: 150_000 },
  { key: '150k-200k', label: '₹1.5 – 2 lakh', min: 150_000, max: 200_000 },
  { key: '200k-300k', label: '₹2 – 3 lakh', min: 200_000, max: 300_000 },
  { key: 'above-300k', label: 'Above ₹3 lakh', min: 300_000, max: null },
]

/** Displacement bands, in the cc steps the segment is actually sold in. */
export const CC_BUCKETS: Bucket[] = [
  { key: 'upto-110', label: 'Upto 110 cc', min: 0, max: 110 },
  { key: '110-125', label: '110 – 125 cc', min: 110, max: 125 },
  { key: '125-160', label: '125 – 160 cc', min: 125, max: 160 },
  { key: '160-200', label: '160 – 200 cc', min: 160, max: 200 },
  { key: '200-350', label: '200 – 350 cc', min: 200, max: 350 },
  { key: 'above-350', label: 'Above 350 cc', min: 350, max: null },
]

function inBucket(value: number | null, bucket: Bucket): boolean {
  if (value === null) return false
  if (value < bucket.min) return false
  return bucket.max === null || value < bucket.max
}

/**
 * Body styles offered as filters.
 *
 * Scooter is here but absent from BODY_TYPES in lib/site.ts, and deliberately
 * so: that list drives the /type/[slug] routes, and scooters already have a
 * better door at /scooters. As a *filter* the option has to exist, or a
 * shopper on /bikes cannot exclude them.
 */
export const BODY_FILTERS: { key: string; label: string }[] = [
  ...BODY_TYPES.map((type) => ({ key: type.slug, label: type.label })),
  { key: 'scooter', label: 'Scooter' },
]

export const FUEL_FILTERS: { key: string; label: string }[] = [
  { key: 'petrol', label: 'Petrol' },
  { key: 'electric', label: 'Electric' },
]

/**
 * Equipment a shopper filters on, each read off a spec column that is actually
 * populated. Nothing here is inferred from a model name.
 */
export const FEATURE_FILTERS: {
  key: string
  label: string
  test: (entry: IndexedVehicle) => boolean
}[] = [
  { key: 'abs', label: 'ABS', test: (entry) => entry.abs },
  { key: 'disc', label: 'Front disc brake', test: (entry) => entry.frontDisc },
  { key: 'bluetooth', label: 'Bluetooth console', test: (entry) => entry.bluetooth },
  { key: 'tubeless', label: 'Tubeless tyres', test: (entry) => entry.tubeless },
]

export type GroupKey = 'brand' | 'budget' | 'cc' | 'body' | 'fuel' | 'features'

/** Grid or list. In the URL so a shared link opens the way it was left. */
export type ViewKey = 'grid' | 'list'

export interface CatalogQuery {
  brand: number[]
  budget: string[]
  cc: string[]
  body: string[]
  fuel: string[]
  features: string[]
  /** Free-text model search, shared with /search. */
  q: string
  sort: SortKey
  view: ViewKey
  /** 1-based, as it appears in the URL. */
  page: number
}

export const EMPTY_QUERY: CatalogQuery = {
  brand: [],
  budget: [],
  cc: [],
  body: [],
  fuel: [],
  features: [],
  q: '',
  sort: DEFAULT_SORT,
  view: 'grid',
  page: 1,
}

type RawParams = Record<string, string | string[] | undefined>

function one(raw: string | string[] | undefined): string {
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? ''
}

/** Comma-separated multi-values: `?brand=1,4,8`. Short URLs, one param per group. */
function many(raw: string | string[] | undefined): string[] {
  return one(raw)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function parseQuery(params: RawParams): CatalogQuery {
  const page = Number.parseInt(one(params.page) || '1', 10)
  const sort = one(params.sort)

  return {
    brand: many(params.brand)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isSafeInteger(value) && value > 0),
    budget: many(params.budget).filter((key) =>
      BUDGET_BUCKETS.some((bucket) => bucket.key === key),
    ),
    cc: many(params.cc).filter((key) =>
      CC_BUCKETS.some((bucket) => bucket.key === key),
    ),
    body: many(params.body).filter((key) =>
      BODY_FILTERS.some((filter) => filter.key === key),
    ),
    fuel: many(params.fuel).filter((key) =>
      FUEL_FILTERS.some((filter) => filter.key === key),
    ),
    features: many(params.features).filter((key) =>
      FEATURE_FILTERS.some((filter) => filter.key === key),
    ),
    q: one(params.q),
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
    view: one(params.view) === 'list' ? 'list' : 'grid',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  }
}

export function activeFilterCount(query: CatalogQuery): number {
  return (
    query.brand.length +
    query.budget.length +
    query.cc.length +
    query.body.length +
    query.fuel.length +
    query.features.length
  )
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * OR inside a group, AND across groups — the convention every faceted listing
 * uses, and the only one where ticking a second brand widens the results rather
 * than emptying them.
 *
 * `skip` drops one group from the predicate. That is what makes the counts
 * beside each option correct: the number next to "Honda" has to be the result
 * of every *other* filter, not of a state where Honda is already ticked.
 */
export function filterVehicles(
  list: IndexedVehicle[],
  query: CatalogQuery,
  skip?: GroupKey,
): IndexedVehicle[] {
  const needle = query.q.trim().toLowerCase()

  return list.filter((entry) => {
    if (needle) {
      const haystack = `${entry.title} ${entry.model} ${entry.brandName ?? ''}`
      if (!haystack.toLowerCase().includes(needle)) return false
    }

    if (skip !== 'brand' && query.brand.length > 0) {
      if (entry.brandId === null || !query.brand.includes(entry.brandId)) return false
    }

    if (skip !== 'budget' && query.budget.length > 0) {
      const match = BUDGET_BUCKETS.filter((bucket) => query.budget.includes(bucket.key))
      if (!match.some((bucket) => inBucket(entry.priceMin, bucket))) return false
    }

    if (skip !== 'cc' && query.cc.length > 0) {
      const match = CC_BUCKETS.filter((bucket) => query.cc.includes(bucket.key))
      if (!match.some((bucket) => inBucket(entry.cc, bucket))) return false
    }

    if (skip !== 'body' && query.body.length > 0) {
      if (entry.bodySlug === null || !query.body.includes(entry.bodySlug)) return false
    }

    if (skip !== 'fuel' && query.fuel.length > 0) {
      const wanted = entry.ev ? 'electric' : 'petrol'
      if (!query.fuel.includes(wanted)) return false
    }

    if (skip !== 'features' && query.features.length > 0) {
      // AND within features, unlike every other group: someone who ticks ABS
      // and Bluetooth wants both, not either.
      const required = FEATURE_FILTERS.filter((filter) =>
        query.features.includes(filter.key),
      )
      if (!required.every((filter) => filter.test(entry))) return false
    }

    return true
  })
}

/** How many of `list` would survive if `value` were added to `group`. */
export function facetCount(
  list: IndexedVehicle[],
  query: CatalogQuery,
  group: GroupKey,
  value: string,
): number {
  const base = filterVehicles(list, query, group)

  switch (group) {
    case 'brand': {
      const id = Number.parseInt(value, 10)
      return base.filter((entry) => entry.brandId === id).length
    }
    case 'budget': {
      const bucket = BUDGET_BUCKETS.find((b) => b.key === value)
      return bucket ? base.filter((entry) => inBucket(entry.priceMin, bucket)).length : 0
    }
    case 'cc': {
      const bucket = CC_BUCKETS.find((b) => b.key === value)
      return bucket ? base.filter((entry) => inBucket(entry.cc, bucket)).length : 0
    }
    case 'body':
      return base.filter((entry) => entry.bodySlug === value).length
    case 'fuel':
      return base.filter((entry) => (entry.ev ? 'electric' : 'petrol') === value).length
    case 'features': {
      const filter = FEATURE_FILTERS.find((f) => f.key === value)
      return filter ? base.filter(filter.test).length : 0
    }
  }
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/** Rows with no value for the sort key sink, rather than leading with blanks. */
function byNumber(
  a: number | null,
  b: number | null,
  direction: 1 | -1,
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return (a - b) * direction
}

export function sortVehicles(
  list: IndexedVehicle[],
  sort: SortKey,
): IndexedVehicle[] {
  const rows = [...list]

  switch (sort) {
    case 'price-low':
      return rows.sort((a, b) => byNumber(a.priceMin, b.priceMin, 1))
    case 'price-high':
      return rows.sort((a, b) => byNumber(a.priceMin, b.priceMin, -1))
    case 'newest':
      return rows.sort((a, b) => byNumber(a.launchTs, b.launchTs, -1))
    case 'mileage':
      return rows.sort((a, b) => byNumber(a.mileage, b.mileage, -1))
    case 'cc':
      return rows.sort((a, b) => byNumber(a.cc, b.cc, -1))
    case 'popular':
    default:
      // No view or sales data exists, so "popular" is the admin's brand rating
      // — the only popularity signal the catalog carries — with price as the
      // tie-break so the order is stable rather than arbitrary within a brand.
      return rows.sort(
        (a, b) => b.brandRating - a.brandRating || byNumber(a.priceMin, b.priceMin, 1),
      )
  }
}

// ---------------------------------------------------------------------------
// URL building
// ---------------------------------------------------------------------------

function serialize(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.q) params.set('q', query.q)
  if (query.brand.length) params.set('brand', query.brand.join(','))
  if (query.budget.length) params.set('budget', query.budget.join(','))
  if (query.cc.length) params.set('cc', query.cc.join(','))
  if (query.body.length) params.set('body', query.body.join(','))
  if (query.fuel.length) params.set('fuel', query.fuel.join(','))
  if (query.features.length) params.set('features', query.features.join(','))
  if (query.sort !== DEFAULT_SORT) params.set('sort', query.sort)
  if (query.view !== 'grid') params.set('view', query.view)
  if (query.page > 1) params.set('page', String(query.page))

  return params
}

export function hrefFor(basePath: string, query: CatalogQuery): string {
  const params = serialize(query)
  const search = params.toString()
  return search ? `${basePath}?${search}` : basePath
}

/**
 * The URL with one option toggled on or off.
 *
 * Page is always dropped: page 4 of an unfiltered list is not page 4 of a
 * filtered one, and landing on an empty page after ticking a brand is the most
 * common way a faceted listing feels broken.
 */
export function toggleHref(
  basePath: string,
  query: CatalogQuery,
  group: GroupKey,
  value: string,
): string {
  const next: CatalogQuery = { ...query, page: 1 }

  if (group === 'brand') {
    const id = Number.parseInt(value, 10)
    next.brand = query.brand.includes(id)
      ? query.brand.filter((entry) => entry !== id)
      : [...query.brand, id]
  } else {
    const current = query[group]
    next[group] = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]
  }

  return hrefFor(basePath, next)
}

export function isActive(
  query: CatalogQuery,
  group: GroupKey,
  value: string,
): boolean {
  if (group === 'brand') return query.brand.includes(Number.parseInt(value, 10))
  return query[group].includes(value)
}

export function sortHref(
  basePath: string,
  query: CatalogQuery,
  sort: SortKey,
): string {
  return hrefFor(basePath, { ...query, sort, page: 1 })
}

export function viewHref(
  basePath: string,
  query: CatalogQuery,
  view: ViewKey,
): string {
  return hrefFor(basePath, { ...query, view })
}

export function pageHref(
  basePath: string,
  query: CatalogQuery,
  page: number,
): string {
  return hrefFor(basePath, { ...query, page })
}

/** Everything cleared except the free-text query, which is the page's subject. */
export function clearHref(basePath: string, query: CatalogQuery): string {
  return hrefFor(basePath, {
    ...EMPTY_QUERY,
    q: query.q,
    sort: query.sort,
    view: query.view,
  })
}

export interface AppliedChip {
  label: string
  /** The URL with this one filter removed. */
  href: string
}

/**
 * The applied-filter row above the results.
 *
 * Brand labels are resolved from the snapshot rather than the URL, so a stale
 * link carrying a deleted brand id renders as its number instead of throwing.
 */
export function appliedChips(
  basePath: string,
  query: CatalogQuery,
  brandName: (id: number) => string | undefined,
): AppliedChip[] {
  const chips: AppliedChip[] = []

  for (const id of query.brand) {
    chips.push({
      label: brandName(id) ?? `Brand ${id}`,
      href: toggleHref(basePath, query, 'brand', String(id)),
    })
  }

  const groups: [GroupKey, { key: string; label: string }[]][] = [
    ['budget', BUDGET_BUCKETS],
    ['cc', CC_BUCKETS],
    ['body', BODY_FILTERS],
    ['fuel', FUEL_FILTERS],
    ['features', FEATURE_FILTERS],
  ]

  for (const [group, options] of groups) {
    for (const value of query[group] as string[]) {
      const option = options.find((entry) => entry.key === value)
      if (!option) continue
      chips.push({
        label: option.label,
        href: toggleHref(basePath, query, group, value),
      })
    }
  }

  return chips
}
