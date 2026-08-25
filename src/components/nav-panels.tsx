import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { getBrands } from '@/lib/api'
import { BUDGET_BUCKETS, CC_BUCKETS } from '@/lib/filters'
import { brandMonogram, brandSlug } from '@/lib/format'
import { BODY_TYPES } from '@/lib/site'
import type { NavKey } from './mega-nav'

/**
 * What opens under Bikes, Scooters, Electric and Brands.
 *
 * Built from the same bucket definitions the filter rail uses (lib/filters.ts),
 * so a menu entry and the page it lands on can never disagree about what
 * "₹1 – 1.5 lakh" means. Everything here is a static link except the brand
 * grid, which is the only column that needs the catalog and is therefore the
 * only one behind a boundary.
 *
 * This is server markup handed to a client component as a prop, so none of it
 * reaches the browser as JavaScript.
 */
export function navPanels(): Partial<Record<NavKey, React.ReactNode>> {
  return {
    bikes: (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Column
          title="By budget"
          links={BUDGET_BUCKETS.map((bucket) => ({
            href: `/bikes?budget=${bucket.key}`,
            label: bucket.label,
          }))}
        />
        <Column
          title="By displacement"
          links={CC_BUCKETS.map((bucket) => ({
            href: `/bikes?cc=${bucket.key}`,
            label: bucket.label,
          }))}
        />
        <Column
          title="By body style"
          links={BODY_TYPES.map((type) => ({
            href: `/type/${type.slug}`,
            label: type.label,
          }))}
        />
        <Column
          title="Shortcuts"
          links={[
            { href: '/bikes', label: 'All bikes' },
            { href: '/bikes?sort=newest', label: 'Newly launched' },
            { href: '/bikes?sort=mileage', label: 'Best mileage' },
            { href: '/bikes?features=abs', label: 'Bikes with ABS' },
            { href: '/compare', label: 'Compare bikes' },
          ]}
        />
      </div>
    ),

    scooters: (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Column
          title="By budget"
          links={BUDGET_BUCKETS.slice(0, 4).map((bucket) => ({
            href: `/scooters?budget=${bucket.key}`,
            label: bucket.label,
          }))}
        />
        <Column
          title="By engine"
          links={CC_BUCKETS.slice(0, 4).map((bucket) => ({
            href: `/scooters?cc=${bucket.key}`,
            label: bucket.label,
          }))}
        />
        <Column
          title="Shortcuts"
          links={[
            { href: '/scooters', label: 'All scooters' },
            { href: '/scooters?fuel=electric', label: 'Electric scooters' },
            { href: '/scooters?sort=mileage', label: 'Best mileage' },
            { href: '/scooters?features=bluetooth', label: 'With Bluetooth' },
          ]}
        />
      </div>
    ),

    electric: (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Column
          title="Browse"
          links={[
            { href: '/electric', label: 'All electric models' },
            { href: '/scooters?fuel=electric', label: 'Electric scooters' },
            { href: '/electric?sort=price-low', label: 'Cheapest first' },
            { href: '/electric?sort=newest', label: 'Newly launched' },
          ]}
        />
        <Column
          title="By budget"
          links={BUDGET_BUCKETS.slice(0, 4).map((bucket) => ({
            href: `/electric?budget=${bucket.key}`,
            label: bucket.label,
          }))}
        />
        <div>
          <p className="micro text-ink-subtle">Why electric</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Most states waive road tax on electric two-wheelers, which takes
            several thousand rupees off the on-road price. The estimator itemises
            it per city.
          </p>
          <Link
            href="/on-road-price"
            className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Check on-road price →
          </Link>
        </div>
      </div>
    ),

    brands: (
      <Suspense fallback={<BrandGridSkeleton />}>
        <BrandGrid />
      </Suspense>
    ),
  }
}

function Column({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="micro text-ink-subtle">{title}</p>
      <ul className="mt-3 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ink-muted transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function BrandGrid() {
  const brands = (await getBrands())
    .filter((brand) => brand.id != null && brand.name)
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) || a.name!.localeCompare(b.name!),
    )

  if (brands.length === 0) return <BrandGridSkeleton />

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="micro text-ink-subtle">Popular brands</p>
        <Link href="/brands" className="text-xs font-semibold text-brand-700 hover:underline">
          All brands →
        </Link>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {brands.slice(0, 12).map((brand) => (
          <li key={brand.id}>
            <Link
              href={`/brands/${brandSlug(brand.name!, brand.id!)}`}
              className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-chip border border-hairline px-2 transition-colors hover:border-ink/20 hover:bg-surface-alt"
            >
              <span className="relative flex h-6 w-full items-center justify-center">
                {brand.imageURL ? (
                  <Image src={brand.imageURL} alt="" fill sizes="72px" className="object-contain" />
                ) : (
                  <span className="display-sm text-[0.625rem] text-ink">
                    {brandMonogram(brand.name)}
                  </span>
                )}
              </span>
              <span className="line-clamp-1 text-center text-[0.6875rem] font-medium text-ink-muted">
                {brand.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BrandGridSkeleton() {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i} className="shimmer h-16 rounded-chip" />
      ))}
    </ul>
  )
}
