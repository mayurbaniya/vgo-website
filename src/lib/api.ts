import { cacheLife, cacheTag } from 'next/cache'
import type {
  ApiEnvelope,
  Brand,
  NewsArticle,
  Offer,
  Paged,
  Vehicle,
} from './types'

const BASE = process.env.API_BASE_URL?.replace(/\/+$/, '') ?? ''

/**
 * One raw GET against the backend.
 *
 * THROWS on any failure — network, non-2xx, bad JSON, or a FAILED envelope.
 *
 * Throwing rather than returning null is deliberate and load-bearing: every
 * caller below is wrapped in `use cache` with an hours-long lifetime, and a
 * returned null would be cached like any other value. A backend blip would
 * then pin empty pages in the cache for an hour after the backend recovered.
 * A thrown error is not cached, so the next request retries. `safe()` converts
 * the throw back into null *outside* the cache boundary.
 */
async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T | null> {
  if (!BASE) throw new Error('[api] API_BASE_URL is not set')

  const url = new URL(`${BASE}${path}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    throw new Error(`[api] ${res.status} ${res.statusText} for ${path}`)
  }

  const body = (await res.json()) as ApiEnvelope<T>
  if (body.status && body.status !== 'SUCCESS') {
    throw new Error(`[api] envelope status=${body.status} for ${path}`)
  }
  return (body.data ?? null) as T | null
}

/**
 * Runs a cached fetcher and degrades a failure to a fallback value.
 *
 * Must stay OUTSIDE the `use cache` boundary — that is the whole point. The
 * catalog is assembled from many independent calls, and one dead endpoint has
 * to degrade to an empty section rather than 500 a page being indexed.
 */
async function safe<T>(fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    return fallback
  }
}

/** Unwraps a paged envelope down to its rows. */
function rows<T>(page: Paged<T> | null): T[] {
  return page?.content ?? []
}

// ---------------------------------------------------------------------------
// Catalog reads.
//
// Each is wrapped in `use cache` with an hours-long lifetime: the catalog is
// admin-edited a few times a week, so serving an hour-stale spec sheet is a
// good trade for keeping the 2 GB backend out of the request path. `cacheTag`
// lets a future admin webhook call revalidateTag('catalog') to push changes
// through immediately.
// ---------------------------------------------------------------------------

/** Paged vehicle fetchers. Each `cached*` throws; the export degrades to null. */

async function cachedVehiclePage(
  path: string,
  params: Record<string, string | number | undefined>,
  tag: string,
): Promise<Paged<Vehicle> | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog', tag)
  return get<Paged<Vehicle>>(path, params)
}

export function getAllBikes(page = 0, size = 24) {
  return safe(
    () => cachedVehiclePage('/user/vehicle/all-except-mofet', { page, size }, 'bikes'),
    null,
  )
}

export function getAllScooters(page = 0, size = 24) {
  return safe(
    () => cachedVehiclePage('/user/vehicle/all-mofet', { page, size }, 'scooters'),
    null,
  )
}

export function getAllVehicles(page = 0, size = 24) {
  return safe(
    () => cachedVehiclePage('/user/vehicle/all', { page, size }, 'all'),
    null,
  )
}

export function getElectricVehicles(page = 0, size = 24) {
  return safe(
    () => cachedVehiclePage('/user/vehicle/electric', { page, size }, 'electric'),
    null,
  )
}

export function getVehiclesByBrand(brandID: number, page = 0, size = 24) {
  return safe(
    () =>
      cachedVehiclePage(
        '/user/vehicle/all-by-brand',
        { brandID, page, size },
        'by-brand',
      ),
    null,
  )
}

export function getNewlyLaunched(size = 12) {
  return safe(async () => {
    const page = await cachedVehiclePage(
      '/user/vehicle/newly-launched',
      { page: 0, size },
      'newly-launched',
    )
    return rows(page)
  }, [] as Vehicle[])
}

async function cachedVehicleById(id: number): Promise<Vehicle | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return get<Vehicle>(`/user/vehicle/get-by-id/${id}`)
}

export function getVehicleById(id: number) {
  return safe(() => cachedVehicleById(id), null)
}

/**
 * `featured` returns join rows shaped { id, priority, vehicle }, not vehicles —
 * flattened here so callers only ever deal with Vehicle.
 */
async function cachedFeatured(): Promise<Vehicle[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  // Paged envelope, not a bare array — verified against the running backend.
  const data = await get<Paged<{ id?: number; priority?: number; vehicle?: Vehicle }>>(
    '/user/vehicle/featured',
  )
  return flatten(data)
    .map((r) => r.vehicle)
    .filter((v): v is Vehicle => Boolean(v))
}

export function getFeaturedVehicles() {
  return safe(cachedFeatured, [] as Vehicle[])
}

/**
 * Every list endpoint on this backend returns a paged envelope
 * (`data.content`), but a couple have historically returned a bare array.
 * Accept either rather than crashing on the shape.
 */
function flatten<T>(data: Paged<T> | T[] | null): T[] {
  if (Array.isArray(data)) return data
  return rows(data)
}

async function cachedBrands(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<Brand[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog', 'brands')
  return flatten(await get<Paged<Brand> | Brand[]>(path, params))
}

/**
 * Every brand, not the first page of them.
 *
 * `/user/brand/all` is paged with `size` defaulting to 10, so calling it bare
 * silently dropped 7 of the 17 brands (Yamaha and TVS among them) off the
 * brands page. The size is a deliberate over-fetch: brands are a short table
 * that grows a row or two a year.
 */
export function getBrands() {
  return safe(
    () => cachedBrands('/user/brand/all', { page: 0, size: 200 }),
    [] as Brand[],
  )
}

export function getPopularBrands() {
  return safe(() => cachedBrands('/user/brand/popular'), [] as Brand[])
}

async function cachedOffers(): Promise<Offer[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('offers')
  return flatten(await get<Paged<Offer> | Offer[]>('/user/offers/active'))
}

export function getActiveOffers() {
  return safe(cachedOffers, [] as Offer[])
}

async function cachedNews(): Promise<NewsArticle[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('news')
  return flatten(await get<Paged<NewsArticle> | NewsArticle[]>('/user/news/automotive'))
}

export function getNews() {
  return safe(cachedNews, [] as NewsArticle[])
}

/**
 * Name search. Backs the hero search field and /search.
 *
 * The endpoint takes no page params — it returns one page of matches — so the
 * result is flattened to a plain list and the UI presents it as "best matches"
 * rather than as a paginated listing.
 */
async function cachedSearch(query: string): Promise<Vehicle[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog', 'search')
  return flatten(
    await get<Paged<Vehicle> | Vehicle[]>('/user/vehicle/search-name', { query }),
  )
}

export function searchVehicles(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return Promise.resolve([] as Vehicle[])
  return safe(() => cachedSearch(trimmed), [] as Vehicle[])
}

/** One body-type listing page (SPORTS, CRUISER, OFF_ROAD, ...). */
export function getVehiclesByBodyType(bodyType: string, page = 0, size = 24) {
  return safe(
    () =>
      cachedVehiclePage(
        '/user/vehicle/search-by-body-type',
        { bodyType, page, size },
        `body-type-${bodyType}`,
      ),
    null,
  )
}

export interface CatalogCounts {
  vehicles: number
  brands: number
  electric: number
}

/**
 * Headline counts for the hero readout.
 *
 * Each figure comes from a `totalElements` on a size=1 request rather than from
 * counting rows, so the hero stays honest as the catalog grows without pulling
 * the whole catalog to render three numbers.
 */
async function cachedCounts(): Promise<CatalogCounts> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog', 'counts')

  const [all, electric, brands] = await Promise.all([
    get<Paged<Vehicle>>('/user/vehicle/all', { page: 0, size: 1 }),
    get<Paged<Vehicle>>('/user/vehicle/electric', { page: 0, size: 1 }),
    get<Paged<Brand> | Brand[]>('/user/brand/all', { page: 0, size: 200 }),
  ])

  return {
    vehicles: all?.totalElements ?? 0,
    electric: electric?.totalElements ?? 0,
    brands: flatten(brands).length,
  }
}

export function getCatalogCounts() {
  return safe(cachedCounts, null)
}
