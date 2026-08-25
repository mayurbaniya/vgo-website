import type { Dictionary } from './i18n/dictionaries'

/** Site-wide constants. Kept out of api.ts so client components can import them. */

export const SITE_NAME = 'VGO'

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.main.vgo'

/**
 * The market the catalog speaks for.
 *
 * This replaced `PRIMARY_CITY = 'Nagpur'`, which used to be stamped into every
 * title, H1 and price label on the site. The reasoning for that was sound when
 * the cities table had one row — city-qualified queries are how people search
 * for two-wheelers here — but it committed every page to one city while the
 * price shown was the national ex-showroom figure, which is the same number
 * everywhere.
 *
 * The shape borrowed from BikeDekho instead: the canonical page is national
 * and competes for "<model> price", and the city-qualified query gets its own
 * URL (/vehicles/[slug]/price-in-[city]) carrying a real on-road figure. One
 * hub, many spokes — rather than one page pretending to be a city page.
 *
 * Nothing here is a default the reader has to accept or dismiss: no city
 * prompt, no gate. City becomes something they navigate to when they want an
 * on-road number.
 */
export const MARKET = 'India'

/**
 * The 'IND' embossed on Indian high-security registration plates.
 *
 * Keeps the plate device in the hero — it read 'MH 31 · NAGPUR' when the site
 * was Nagpur-only. A rider recognises the marking just as immediately, and it
 * no longer claims a city the page does not speak for.
 */
export const MARKET_PLATE = 'IND'

/**
 * Primary destinations.
 *
 * Each carries a dictionary key rather than a label: the nav is chrome, so its
 * wording comes from `lib/i18n/dictionaries` and changes with the reader's
 * language. Keeping an English string here as well would be a second source of
 * truth that only the English reader ever proves right.
 */
export const NAV_LINKS = [
  { href: '/bikes', key: 'bikes' },
  { href: '/scooters', key: 'scooters' },
  { href: '/electric', key: 'electric' },
  { href: '/brands', key: 'brands' },
  { href: '/offers', key: 'offers' },
  { href: '/news', key: 'news' },
] as const satisfies readonly { href: string; key: keyof Dictionary['nav'] }[]

/**
 * Body types offered as browse entry points.
 *
 * `code` is the value `/user/vehicle/search-by-body-type` filters on. MOFET is
 * deliberately absent: it is the legacy scooter code and its rows are already
 * covered by /scooters, so listing it would give people two doors into one
 * room. Scooter therefore points at the dedicated listing rather than at a
 * body-type page.
 */
export const BODY_TYPES = [
  { slug: 'sports', code: 'SPORTS', key: 'sports', label: 'Sports', blurb: 'Track-ready performance' },
  { slug: 'street', code: 'STREET', key: 'street', label: 'Street', blurb: 'Everyday all-rounder' },
  { slug: 'cruiser', code: 'CRUISER', key: 'cruiser', label: 'Cruiser', blurb: 'Long-haul comfort' },
  { slug: 'off-road', code: 'OFF_ROAD', key: 'offRoad', label: 'Off-road', blurb: 'Built for the rough stuff' },
  { slug: 'cafe-racer', code: 'CAFE_RACER', key: 'cafeRacer', label: 'Cafe racer', blurb: 'Classic style, modern soul' },
] as const satisfies readonly {
  slug: string
  code: string
  key: keyof Dictionary['bodyTypes']
  label: string
  blurb: string
}[]

export type BodyType = (typeof BODY_TYPES)[number]

export function bodyTypeBySlug(slug: string): BodyType | undefined {
  return BODY_TYPES.find((t) => t.slug === slug)
}

/**
 * Display label for a raw `vehicleType` code coming off the API.
 *
 * English only, and deliberately so. This is called from `vehicle-card`, which
 * renders inside `use cache` scopes — a label that varied by reader would be
 * baked into shared cached output and served to everyone. Translating catalog
 * chrome means making the language part of those cache keys; see the note in
 * `lib/i18n/server.ts`.
 */
export function bodyTypeLabel(code?: string | null): string | null {
  if (!code) return null
  const key = code.trim().toUpperCase()
  if (key === 'MOFET' || key === 'SCOOTER') return 'Scooter'
  if (key === 'ELECTRIC') return 'Electric'
  const match = BODY_TYPES.find((t) => t.code === key)
  return match?.label ?? null
}
