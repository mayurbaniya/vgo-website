/**
 * The catalog index.
 *
 * The public API has no filter, sort or facet parameters — `/vehicles` takes a
 * page and a size, and that is all. BikeWale-style browsing (budget bands,
 * displacement bands, brand + body style + fuel combined, six sort orders, live
 * counts beside every option) therefore has to be assembled here.
 *
 * That is affordable because the catalog is small: 18 rows today, and the
 * backend caps a page at 100 (Paging.MAX_PAGE_SIZE). This module pulls the
 * whole thing once per cache lifetime and derives a numeric index over it.
 *
 * WHEN TO STOP DOING THIS: the walk below is capped at MAX_ROWS. Past roughly a
 * thousand vehicles the right move is filter parameters on
 * PublicCatalogController and a paged query per request — at which point the
 * shape of `CatalogQuery` in lib/filters.ts is what that endpoint should
 * accept, so the migration is a swap of `filterVehicles` for a fetch rather
 * than a rewrite.
 */
import { cacheLife } from 'next/cache'
import { getAllVehicles, getBrands } from './api'
import {
  isElectric,
  isScooter,
  modelLabel,
  priceBounds,
  vehicleHref,
  vehicleTitle,
} from './format'
import { CC_BUCKETS } from './filters'
import { BODY_TYPES, bodyTypeLabel } from './site'
import type { Brand, Vehicle } from './types'

const PAGE_SIZE = 100
const MAX_ROWS = 1000

/**
 * A vehicle with every value the browser compares against parsed once.
 *
 * The raw row is kept whole under `vehicle` rather than spread into this
 * object: `Vehicle.weight` is `string | number | null` and `Vehicle.price` is a
 * string, so flattening would either collide with the parsed numbers or force
 * every derived field into a prefixed name. Card components keep taking a plain
 * `Vehicle` and are untouched by any of this.
 */
export interface IndexedVehicle {
  vehicle: Vehicle
  id: number
  href: string
  /** "Bajaj Pulsar NS200" — brand-prefixed, for headings and compare columns. */
  title: string
  /** "Pulsar NS200" — brand stripped, for cards that show the brand separately. */
  model: string
  brandId: number | null
  brandName: string | null
  /** Admin popularity 1-10, 0 when unrated. Drives the default sort. */
  brandRating: number
  /** Filter/URL key: sports, street, cruiser, off-road, cafe-racer, scooter. */
  bodySlug: string | null
  bodyLabel: string | null
  ev: boolean
  priceMin: number | null
  priceMax: number | null
  cc: number | null
  /** kmpl. Null on EVs — those are compared on range instead. */
  mileage: number | null
  topSpeed: number | null
  rangeKm: number | null
  weight: number | null
  seatHeight: number | null
  /** Epoch ms from `launchDate`; null when unparseable. */
  launchTs: number | null
  abs: boolean
  frontDisc: boolean
  bluetooth: boolean
  tubeless: boolean
}

export interface CatalogSnapshot {
  vehicles: IndexedVehicle[]
  brands: Brand[]
  /**
   * Start of today, epoch ms. Carried on the snapshot so every "launched
   * recently" badge in one render agrees on the same value, and so no component
   * has to read the clock on its own.
   */
  today: number
}

/**
 * Leading number in a free-text spec value.
 *
 * Catalog values are inconsistent row to row — mileage arrives as "29 kmpl",
 * "27 km/l" or a bare "45"; weight as "168 kg" or "168". Indian digit grouping
 * is stripped so "1,68,000" parses, and a decimal tail is kept so "2.9 kWh"
 * reads 2.9 rather than 2.
 */
function leadingNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null

  const text = String(raw).trim()
  if (!text) return null

  const match = /^[\d,]+(?:\.\d+)?/.exec(text)
  if (!match) return null

  const value = Number.parseFloat(match[0].replace(/,/g, ''))
  return Number.isFinite(value) && value > 0 ? value : null
}

/** True when a free-text spec field mentions any of the given words. */
function mentions(raw: unknown, ...words: string[]): boolean {
  if (raw === null || raw === undefined) return false
  const text = String(raw).toLowerCase()
  return words.some((word) => text.includes(word))
}

/**
 * The body-style key a vehicle filters under.
 *
 * MOFET and SCOOTER both mean scooter (see isScooter). ELECTRIC is deliberately
 * NOT a body style: an Ather 450X is a scooter that happens to be electric, and
 * folding fuel into the body axis would make "Scooter" and "Electric" overlap
 * in a way that double-counts every EV. Fuel is its own filter — the same split
 * BikeWale draws.
 */
function bodySlugOf(v: Vehicle): string | null {
  if (isScooter(v)) return 'scooter'
  const code = v.vehicleType?.trim().toUpperCase()
  if (!code) return null
  return BODY_TYPES.find((type) => type.code === code)?.slug ?? null
}

function index(v: Vehicle): IndexedVehicle | null {
  if (v.id == null) return null

  const bounds = priceBounds(v)
  const bodySlug = bodySlugOf(v)
  const launch = v.launchDate ? Date.parse(v.launchDate) : Number.NaN

  return {
    vehicle: v,
    id: v.id,
    href: vehicleHref(v),
    title: vehicleTitle(v),
    model: modelLabel(v),
    brandId: v.brand?.id ?? null,
    brandName: v.brand?.name?.trim() ?? null,
    brandRating: v.brand?.rating ?? 0,
    bodySlug,
    bodyLabel: bodySlug === 'scooter' ? 'Scooter' : bodyTypeLabel(v.vehicleType),
    ev: isElectric(v),
    priceMin: bounds?.[0] ?? null,
    priceMax: bounds?.[1] ?? null,
    cc: leadingNumber(v.powerCC),
    mileage: leadingNumber(v.mileageClaimed) ?? leadingNumber(v.mileageUser),
    topSpeed: leadingNumber(v.topSpeed),
    rangeKm: leadingNumber(v.certifiedRange),
    weight: leadingNumber(v.weight),
    seatHeight: leadingNumber(v.seatHeight),
    launchTs: Number.isFinite(launch) ? launch : null,
    // Single vs dual channel ABS against CBS is the distinction riders actually
    // shop on, read off the one free-text column that carries it.
    abs: mentions(v.brakingType, 'abs'),
    frontDisc: mentions(v.frontBrake, 'disc'),
    bluetooth: v.bluetooth === true,
    tubeless: mentions(v.tyreType, 'tubeless'),
  }
}

/**
 * Index a list that came from somewhere other than the snapshot.
 *
 * The featured, newly-launched and search endpoints each return their own
 * ordered list, and those orders are editorial — re-deriving them from the
 * snapshot would throw the ordering away. They are indexed as they arrive
 * instead, so a card renders identically wherever its row came from.
 */
export function indexVehicles(rows: Vehicle[]): IndexedVehicle[] {
  return rows.map(index).filter((entry): entry is IndexedVehicle => entry !== null)
}

/**
 * Every vehicle in the catalog, indexed.
 *
 * Deliberately NOT wrapped in `use cache`. Each page fetch underneath is
 * already cached by lib/api.ts, and `getAllVehicles` degrades a backend failure
 * to null *outside* its own cache boundary — caching this function's return
 * value would put that degraded empty list back inside a cache and pin an empty
 * catalog for an hour after the backend recovered. The derivation itself is one
 * pass over at most MAX_ROWS plain objects, so there is nothing here worth
 * caching anyway.
 */
export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  const [rows, brands, today] = await Promise.all([
    fetchAllRows(),
    getBrands(),
    getToday(),
  ])

  return { vehicles: indexVehicles(rows), brands, today }
}

async function fetchAllRows(): Promise<Vehicle[]> {
  const first = await getAllVehicles(0, PAGE_SIZE)
  if (!first) return []

  const rows = [...(first.content ?? [])]
  const totalPages = first.totalPages ?? 1
  const lastPage = Math.min(totalPages, Math.ceil(MAX_ROWS / PAGE_SIZE))

  if (lastPage > 1) {
    // The pages are independent and each is its own cache entry, so they are
    // fetched together rather than walked one after another.
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        getAllVehicles(i + 1, PAGE_SIZE),
      ),
    )
    for (const page of rest) rows.push(...(page?.content ?? []))
  }

  return rows
}

/**
 * Midnight today (UTC), epoch ms.
 *
 * Reading the clock during prerender is an error under Cache Components; `use
 * cache` with a lifetime is the sanctioned fix, and it is the shape
 * site-footer.tsx also uses for the copyright year. A day-long life is ample —
 * this decides whether a launch badge says "New", and what year the footer
 * claims.
 */
export async function getToday(): Promise<number> {
  'use cache'
  cacheLife('days')

  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

// ---------------------------------------------------------------------------
// Derived reads. All pure — they take indexed rows and return indexed rows.
// ---------------------------------------------------------------------------

/** How long a launch stays badged as new. Matches how the portals mark arrivals. */
export const NEW_FOR_DAYS = 120

export function isNewlyLaunched(entry: IndexedVehicle, today: number): boolean {
  if (entry.launchTs === null) return false
  const age = today - entry.launchTs
  return age >= 0 && age <= NEW_FOR_DAYS * 86_400_000
}

export function findById(
  snapshot: CatalogSnapshot,
  id: number,
): IndexedVehicle | undefined {
  return snapshot.vehicles.find((entry) => entry.id === id)
}

/**
 * The models a shopper looking at this one would also look at.
 *
 * Scored rather than filtered, because a hard "same body style AND same price
 * band" match returns nothing on a catalog this size. Body style and fuel carry
 * the most weight — a cruiser shopper is not cross-shopping a scooter — then
 * price proximity, then displacement.
 */
export function similarVehicles(
  target: IndexedVehicle,
  all: IndexedVehicle[],
  limit = 4,
): IndexedVehicle[] {
  return all
    .filter((entry) => entry.id !== target.id)
    .map((entry) => {
      let score = 0
      if (entry.bodySlug && entry.bodySlug === target.bodySlug) score += 40
      if (entry.ev === target.ev) score += 25

      if (target.priceMin && entry.priceMin) {
        const gap = Math.abs(entry.priceMin - target.priceMin) / target.priceMin
        score += Math.max(0, 30 - gap * 60)
      }

      if (target.cc && entry.cc) {
        const gap = Math.abs(entry.cc - target.cc) / target.cc
        score += Math.max(0, 20 - gap * 40)
      }

      if (entry.brandId !== null && entry.brandId === target.brandId) score += 5

      return { entry, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => scored.entry)
}

export type Metric =
  | 'mileage'
  | 'weight'
  | 'cc'
  | 'topSpeed'
  | 'rangeKm'
  | 'seatHeight'

export interface SegmentStanding {
  /** Percentage of the segment this vehicle beats on the metric, 0-100. */
  percent: number
  /** How many models it was measured against, so the claim can be qualified. */
  peers: number
  /** "cruisers", "electric scooters" — what the segment is, for the sentence. */
  segment: string
}

/**
 * Where a vehicle sits in its segment on one metric.
 *
 * This is what turns a spec sheet into a decision: "34 kmpl" means nothing on
 * its own, "better mileage than 78% of scooters" is a sentence a shopper can
 * act on. Every number here is computed from catalog rows — no editorial score
 * is invented anywhere on this site.
 *
 * Returns null when even the widest peer group is too small for a percentage
 * to mean anything, and the caller then shows the bare figure instead.
 */
export function segmentStanding(
  target: IndexedVehicle,
  all: IndexedVehicle[],
  metric: Metric,
  lowerIsBetter = false,
): SegmentStanding | null {
  const value = target[metric]
  if (value === null) return null

  const group = peerGroup(target, all, metric)
  if (!group) return null

  const beaten = group.peers.filter((entry) => {
    const other = entry[metric] as number
    return lowerIsBetter ? other > value : other < value
  }).length

  return {
    percent: Math.round((beaten / group.peers.length) * 100),
    peers: group.peers.length,
    segment: group.label,
  }
}

/** Below this, a percentage is arithmetic dressed up as a finding. */
const MIN_PEERS = 3

/**
 * Who this vehicle is measured against, narrowest useful group first.
 *
 * Body style is the honest comparison — a cruiser against cruisers — but on a
 * catalog this size most styles hold two or three models, and a guard at
 * MIN_PEERS then silences the comparison on almost every page. So it widens:
 * body style, then fuel plus a displacement band, then fuel alone. The label
 * widens with it, which is the point — the sentence always names the group the
 * percentage was actually taken over, so it stays true as the group changes.
 */
function peerGroup(
  target: IndexedVehicle,
  all: IndexedVehicle[],
  metric: Metric,
): { peers: IndexedVehicle[]; label: string } | null {
  const candidates = all.filter(
    (entry) => entry.id !== target.id && entry[metric] !== null,
  )

  const byBody = candidates.filter((entry) => entry.bodySlug === target.bodySlug)
  if (target.bodySlug !== null && byBody.length >= MIN_PEERS) {
    return { peers: byBody, label: bodyLabelPlural(target) }
  }

  const sameFuel = candidates.filter((entry) => entry.ev === target.ev)

  if (!target.ev && target.cc !== null) {
    const band = CC_BUCKETS.find(
      (bucket) =>
        target.cc! >= bucket.min && (bucket.max === null || target.cc! < bucket.max),
    )
    if (band) {
      const byBand = sameFuel.filter(
        (entry) =>
          entry.cc !== null &&
          entry.cc >= band.min &&
          (band.max === null || entry.cc < band.max),
      )
      if (byBand.length >= MIN_PEERS) {
        return { peers: byBand, label: `${band.label.toLowerCase()} bikes` }
      }
    }
  }

  if (sameFuel.length >= MIN_PEERS) {
    return {
      peers: sameFuel,
      label: target.ev ? 'electric two-wheelers' : 'petrol two-wheelers',
    }
  }

  return null
}

function bodyLabelPlural(entry: IndexedVehicle): string {
  if (entry.bodySlug === 'scooter') {
    return entry.ev ? 'electric scooters' : 'scooters'
  }
  if (entry.bodyLabel) return `${entry.bodyLabel.toLowerCase()} models`
  return entry.ev ? 'electric two-wheelers' : 'two-wheelers'
}

export interface ComparisonPair {
  left: IndexedVehicle
  right: IndexedVehicle
}

/**
 * Head-to-heads worth putting on the home page.
 *
 * The portals hand-curate these. With no editorial table to read from, pairs
 * are generated the way a shopper builds one — the two closest-priced models in
 * the same body style, from different brands, since two bikes from one maker is
 * a variant question rather than a cross-shop.
 */
export function popularComparisons(
  all: IndexedVehicle[],
  limit = 6,
): ComparisonPair[] {
  const pairs: { pair: ComparisonPair; gap: number }[] = []

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const left = all[i]
      const right = all[j]

      if (!left.bodySlug || left.bodySlug !== right.bodySlug) continue
      if (left.brandId !== null && left.brandId === right.brandId) continue
      if (!left.priceMin || !right.priceMin) continue

      const gap = Math.abs(left.priceMin - right.priceMin) / left.priceMin
      if (gap > 0.35) continue

      pairs.push({ pair: { left, right }, gap })
    }
  }

  pairs.sort((a, b) => a.gap - b.gap)

  // One appearance per model, so the strip reads as six different questions
  // rather than as the same bike matched against five rivals.
  const used = new Set<number>()
  const picked: ComparisonPair[] = []

  for (const { pair } of pairs) {
    if (used.has(pair.left.id) || used.has(pair.right.id)) continue
    used.add(pair.left.id)
    used.add(pair.right.id)
    picked.push(pair)
    if (picked.length === limit) break
  }

  return picked
}
