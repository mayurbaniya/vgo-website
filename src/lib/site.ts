/** Site-wide constants. Kept out of api.ts so client components can import them. */

export const SITE_NAME = 'VGO'

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.main.vgo'

/**
 * The catalog covers exactly one city today (`/user/city/all` returns only
 * Nagpur), and saying so in titles is what makes the pages rank for the
 * "<model> price in Nagpur" queries people actually search. Revisit when the
 * cities table grows — at that point city belongs in the URL, not a constant.
 */
export const PRIMARY_CITY = 'Nagpur'

/** Nagpur's RTO series. Used once, as the hero eyebrow. */
export const PRIMARY_CITY_RTO = 'MH 31'

export const NAV_LINKS = [
  { href: '/bikes', label: 'Bikes' },
  { href: '/scooters', label: 'Scooters' },
  { href: '/electric', label: 'Electric' },
  { href: '/brands', label: 'Brands' },
  { href: '/offers', label: 'Offers' },
  { href: '/news', label: 'News' },
] as const

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
  { slug: 'sports', code: 'SPORTS', label: 'Sports', blurb: 'Track-ready performance' },
  { slug: 'street', code: 'STREET', label: 'Street', blurb: 'Everyday all-rounder' },
  { slug: 'cruiser', code: 'CRUISER', label: 'Cruiser', blurb: 'Long-haul comfort' },
  { slug: 'off-road', code: 'OFF_ROAD', label: 'Off-road', blurb: 'Built for the rough stuff' },
  { slug: 'cafe-racer', code: 'CAFE_RACER', label: 'Cafe racer', blurb: 'Classic style, modern soul' },
] as const

export type BodyType = (typeof BODY_TYPES)[number]

export function bodyTypeBySlug(slug: string): BodyType | undefined {
  return BODY_TYPES.find((t) => t.slug === slug)
}

/** Display label for a raw `vehicleType` code coming off the API. */
export function bodyTypeLabel(code?: string | null): string | null {
  if (!code) return null
  const key = code.trim().toUpperCase()
  if (key === 'MOFET' || key === 'SCOOTER') return 'Scooter'
  if (key === 'ELECTRIC') return 'Electric'
  const match = BODY_TYPES.find((t) => t.code === key)
  return match?.label ?? null
}
