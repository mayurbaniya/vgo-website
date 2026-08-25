/**
 * The backend client.
 *
 * Everything here targets /public/v1 — the anonymous, read-only catalog
 * surface (com.wheely.controller.publicapi.PublicCatalogController). The rest
 * of that API is JWT-only and built for the mobile app; the equivalent
 * /user/** endpoints all answered this site with a 401.
 *
 * There is deliberately no credential in this file. Every call below runs on
 * the Next server inside a `use cache` boundary, never in the browser, so a
 * service token would have been possible — but it would mean a long-lived
 * secret in the web host env that unlocks the whole authenticated surface if
 * it leaks. The catalog is data this site publishes to crawlers anyway, so it
 * is served as public data instead, rate-limited and CDN-cacheable at source.
 * Nothing user-scoped is reachable from here, by construction.
 */
import { cacheLife, cacheTag } from 'next/cache'
import type {
  ApiEnvelope,
  Brand,
  City,
  NewsArticle,
  Offer,
  Paged,
  Review,
  ReviewSummary,
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

/**
 * Paged vehicle fetchers. Each `cached*` throws; the export degrades to null.
 *
 * The per-listing endpoints this file used to wrap — /vehicles/bikes,
 * /scooters, /electric, /by-brand, /by-body-type and /search — are gone from
 * here. Not because the backend dropped them, but because the site now filters
 * on more axes than the API offers (budget, displacement, equipment, six sort
 * orders) and needs live counts beside every option, none of which a
 * single-axis endpoint can answer. lib/catalog.ts pulls the catalog once and
 * every listing narrows that one pool, so /bikes and /scooters cannot disagree
 * about what a scooter is. See the note at the top of that file for the point
 * at which this should move back to the server.
 */

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

export function getAllVehicles(page = 0, size = 24) {
  return safe(
    () => cachedVehiclePage('/public/v1/vehicles', { page, size }, 'all'),
    null,
  )
}

export function getNewlyLaunched(size = 12) {
  return safe(async () => {
    const page = await cachedVehiclePage(
      '/public/v1/vehicles/newly-launched',
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
  return get<Vehicle>(`/public/v1/vehicles/${id}`)
}

export function getVehicleById(id: number) {
  return safe(() => cachedVehicleById(id), null)
}

/**
 * Editorially featured vehicles, already in priority order.
 *
 * The authenticated endpoint returns join rows shaped { id, priority, vehicle }
 * inside a paged envelope, which every client then has to unwrap. The public
 * endpoint flattens that server-side — priority is an internal merchandising
 * weight — so this is a plain list.
 */
async function cachedFeatured(): Promise<Vehicle[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return flatten(await get<Vehicle[]>('/public/v1/vehicles/featured'))
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
 * The endpoint is paged and its default size is small, so calling it bare
 * silently dropped 7 of the 17 brands (Yamaha and TVS among them) off the
 * brands page. 100 is the server-side ceiling (Paging.MAX_PAGE_SIZE) and a
 * deliberate over-fetch: brands are a short table that grows a row or two a
 * year. Asking for more is clamped to 100 anyway, so a larger number here
 * would only read as a guarantee the backend does not make.
 */
export function getBrands() {
  return safe(
    () => cachedBrands('/public/v1/brands', { page: 0, size: 100 }),
    [] as Brand[],
  )
}

export function getPopularBrands() {
  return safe(() => cachedBrands('/public/v1/brands/popular'), [] as Brand[])
}

async function cachedOffers(): Promise<Offer[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('offers')
  return flatten(await get<Paged<Offer> | Offer[]>('/public/v1/offers'))
}

export function getActiveOffers() {
  return safe(cachedOffers, [] as Offer[])
}

async function cachedNews(): Promise<NewsArticle[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('news')
  return flatten(await get<Paged<NewsArticle> | NewsArticle[]>('/public/v1/news'))
}

export function getNews() {
  return safe(cachedNews, [] as NewsArticle[])
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
    get<Paged<Vehicle>>('/public/v1/vehicles', { page: 0, size: 1 }),
    get<Paged<Vehicle>>('/public/v1/vehicles/electric', { page: 0, size: 1 }),
    get<Paged<Brand> | Brand[]>('/public/v1/brands', { page: 0, size: 100 }),
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

/**
 * Cities the product actually serves.
 *
 * The one endpoint this file reads outside /public/v1, and deliberately: there
 * is no public cities route yet, and `/user/city/all` is explicitly permitAll
 * in the backend's SecurityConfig (see the requestMatchers line that lists it
 * beside /user/auth/**), so it is public in fact even though it sits in the
 * /user namespace. Nothing user-scoped is reachable through it — it returns the
 * city table and nothing else.
 *
 * MOVE THIS when the backend is next touched: a `/public/v1/cities` route on
 * PublicCatalogController is two lines, and it would stop this site depending
 * on one hand-made exception inside someone else's namespace. As it stands,
 * anyone tightening /user/** breaks the on-road price tool and nothing warns
 * them.
 *
 * Degrades to an empty list, which the callers render as "no cities on file"
 * rather than as an invented one.
 */
async function cachedCities(): Promise<City[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('cities')
  return flatten(await get<Paged<City> | City[]>('/user/city/all'))
}

export function getCities() {
  return safe(cachedCities, [] as City[])
}

// ---------------------------------------------------------------------------
// Owner reviews
//
// These two routes are newer than the rest of the public surface. Until the
// backend carrying them is deployed the endpoint answers with an ERROR
// envelope, `get` throws, and `safe` degrades each call to "no reviews" —
// which is exactly what the site rendered before they existed. So this ships
// safely ahead of the backend and starts showing real reviews the moment it
// lands, with no second deploy here.
// ---------------------------------------------------------------------------

async function cachedReviews(id: number, size: number): Promise<Review[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('reviews', `reviews-${id}`)
  return flatten(
    await get<Paged<Review> | Review[]>(`/public/v1/vehicles/${id}/reviews`, {
      page: 0,
      size,
    }),
  )
}

export function getVehicleReviews(id: number, size = 6) {
  return safe(() => cachedReviews(id, size), [] as Review[])
}

async function cachedReviewSummary(id: number): Promise<ReviewSummary | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('reviews', `reviews-${id}`)
  return get<ReviewSummary>(`/public/v1/vehicles/${id}/review-summary`)
}

export function getVehicleReviewSummary(id: number) {
  return safe(() => cachedReviewSummary(id), null)
}
