import type { MetadataRoute } from 'next'
import { getBrands } from '@/lib/api'
import { getCatalogSnapshot } from '@/lib/catalog'
import { BUDGET_BUCKETS, CC_BUCKETS } from '@/lib/filters'
import { brandSlug } from '@/lib/format'
import { BODY_TYPES, SITE_URL } from '@/lib/site'

/**
 * Static destinations.
 *
 * /search, /used-bikes and /showrooms are deliberately absent: the first is
 * noindex by design (thin, infinite, competes with the listings that are meant
 * to rank) and the other two are placeholders for sections that do not exist
 * yet. Submitting a URL we have told robots not to index is a contradiction a
 * crawler will resolve against us.
 */
const STATIC_PATHS = [
  '',
  '/bikes',
  '/scooters',
  '/electric',
  '/brands',
  '/offers',
  '/news',
  '/compare',
  '/emi-calculator',
  '/on-road-price',
  '/privacy-policy',
]

/**
 * Every URL worth crawling.
 *
 * Three kinds: the fixed pages above, one page per vehicle and brand, and the
 * facet hubs — /bikes?budget=100k-150k and friends. The facets are here because
 * they are what people actually search ("bikes under 1 lakh", "150cc bikes"),
 * they render server-side with real content, and nothing else on the site links
 * to all of them from one place. They are also finite and small: six budget
 * bands plus six displacement bands plus five body styles, not the combinatorial
 * explosion an unbounded filter set would produce.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  for (const bucket of BUDGET_BUCKETS) {
    entries.push({
      url: `${SITE_URL}/bikes?budget=${bucket.key}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  for (const bucket of CC_BUCKETS) {
    entries.push({
      url: `${SITE_URL}/bikes?cc=${bucket.key}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  for (const type of BODY_TYPES) {
    entries.push({
      url: `${SITE_URL}/type/${type.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  const [brands, snapshot] = await Promise.all([getBrands(), getCatalogSnapshot()])

  for (const brand of brands) {
    if (brand.id == null || !brand.name) continue
    entries.push({
      url: `${SITE_URL}/brands/${brandSlug(brand.name, brand.id)}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  for (const vehicle of snapshot.vehicles) {
    entries.push({
      url: `${SITE_URL}${vehicle.href}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  return entries
}
