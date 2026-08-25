import Image from 'next/image'
import Link from 'next/link'
import type { CatalogSnapshot } from '@/lib/catalog'
import {
  BODY_FILTERS,
  BUDGET_BUCKETS,
  CC_BUCKETS,
  EMPTY_QUERY,
  facetCount,
} from '@/lib/filters'
import { brandMonogram, brandSlug } from '@/lib/format'
import { Tabs } from './tabs'

/**
 * "Browse bikes by" — brand, budget, displacement, body style.
 *
 * This is the module that separates a portal from a catalog. It states, on the
 * home page, every axis the site can be sliced along and how many models sit
 * behind each slice, and every one of those is a real URL. For a reader it is
 * the fastest route from "I have ₹1.2 lakh" to a shortlist; for a crawler it is
 * a hub page linking to every facet the site wants indexed.
 *
 * Counts are computed against the whole catalog rather than hard-coded, so a
 * band that empties out shows a zero instead of promising results that are not
 * there.
 */
export function BrowseBy({ snapshot }: { snapshot: CatalogSnapshot }) {
  const all = snapshot.vehicles

  const brands = snapshot.brands
    .filter((brand) => brand.id != null && brand.name)
    .map((brand) => ({
      brand,
      count: all.filter((entry) => entry.brandId === brand.id).length,
    }))
    .filter((row) => row.count > 0)
    .sort(
      (a, b) =>
        (b.brand.rating ?? 0) - (a.brand.rating ?? 0) ||
        a.brand.name!.localeCompare(b.brand.name!),
    )

  return (
    <Tabs
      ariaLabel="Browse the catalog by"
      tabs={[
        {
          key: 'brand',
          label: 'Brand',
          panel: (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {brands.map(({ brand, count }) => (
                <li key={brand.id}>
                  <Link
                    href={`/brands/${brandSlug(brand.name!, brand.id!)}`}
                    className="card card-interactive group flex h-24 flex-col items-center justify-center gap-2 px-3"
                  >
                    <span className="relative flex h-8 w-full items-center justify-center">
                      {brand.imageURL ? (
                        <Image
                          src={brand.imageURL}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                      ) : (
                        <span className="display-sm flex size-8 items-center justify-center rounded-chip bg-ground text-xs text-ground-ink">
                          {brandMonogram(brand.name)}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-center text-xs font-semibold text-ink">
                      {brand.name}
                    </span>
                    <span className="micro tnum text-ink-subtle">
                      {count} {count === 1 ? 'model' : 'models'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ),
        },
        {
          key: 'budget',
          label: 'Budget',
          panel: (
            <TileGrid
              tiles={BUDGET_BUCKETS.map((bucket) => ({
                href: `/bikes?budget=${bucket.key}`,
                label: bucket.label,
                count: facetCount(all, EMPTY_QUERY, 'budget', bucket.key),
              }))}
            />
          ),
        },
        {
          key: 'cc',
          label: 'Displacement',
          panel: (
            <TileGrid
              tiles={CC_BUCKETS.map((bucket) => ({
                href: `/bikes?cc=${bucket.key}`,
                label: bucket.label,
                count: facetCount(all, EMPTY_QUERY, 'cc', bucket.key),
              }))}
            />
          ),
        },
        {
          key: 'body',
          label: 'Body style',
          panel: (
            <TileGrid
              tiles={BODY_FILTERS.map((filter) => ({
                // Body styles have their own routes, which are the pages built
                // to rank for "<style> bikes in India" — the filter param would
                // land on the same rows behind a URL nothing links to.
                href: filter.key === 'scooter' ? '/scooters' : `/type/${filter.key}`,
                label: filter.label,
                count: all.filter((entry) => entry.bodySlug === filter.key).length,
              }))}
            />
          ),
        },
      ]}
    />
  )
}

function TileGrid({
  tiles,
}: {
  tiles: { href: string; label: string; count: number }[]
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <li key={tile.href}>
          <Link
            href={tile.href}
            className="card card-interactive group flex h-24 flex-col justify-between p-4"
          >
            <span className="display-sm text-sm leading-snug text-ink">
              {tile.label}
            </span>
            <span className="flex items-end justify-between gap-2">
              <span className="micro tnum text-ink-subtle">
                {tile.count} {tile.count === 1 ? 'model' : 'models'}
              </span>
              <span
                aria-hidden
                className="text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-signal"
              >
                →
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
