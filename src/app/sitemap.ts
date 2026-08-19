import type { MetadataRoute } from 'next'
import { getAllVehicles, getBrands } from '@/lib/api'
import { brandSlug, vehicleHref } from '@/lib/format'
import { SITE_URL } from '@/lib/site'

const STATIC_PATHS = [
  '',
  '/bikes',
  '/scooters',
  '/electric',
  '/brands',
  '/offers',
  '/news',
  '/privacy-policy',
]

/**
 * Every vehicle and brand URL, so crawlers find detail pages without having to
 * walk the paginated listings.
 *
 * The catalog is small enough (one city, two-wheelers only) to fit the 50,000
 * URL / 50 MB single-file sitemap limit comfortably. If it ever outgrows that,
 * switch to generateSitemaps() and shard by brand.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  const [brands, vehiclePage] = await Promise.all([
    getBrands(),
    // One large page rather than walking every page: the sitemap is rebuilt on
    // its cache lifetime, and a loop here would hammer the 2 GB backend.
    getAllVehicles(0, 1000),
  ])

  for (const brand of brands) {
    if (brand.id == null || !brand.name) continue
    entries.push({
      url: `${SITE_URL}/brands/${brandSlug(brand.name, brand.id)}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  for (const vehicle of vehiclePage?.content ?? []) {
    if (vehicle.id == null) continue
    entries.push({
      url: `${SITE_URL}${vehicleHref(vehicle)}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  return entries
}
