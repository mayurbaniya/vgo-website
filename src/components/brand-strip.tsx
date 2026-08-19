import Image from 'next/image'
import Link from 'next/link'
import type { Brand } from '@/lib/types'
import { brandMonogram, brandSlug } from '@/lib/format'

/**
 * Brand tiles.
 *
 * Most brands in the catalog have no uploaded logo, so a tile that renders only
 * a name sits next to one that renders a logo and the row looks half-finished.
 * Every tile therefore gets the same fixed-height mark slot: the logo when
 * there is one, a monogram when there isn't.
 */
export function BrandStrip({ brands }: { brands: Brand[] }) {
  const usable = brands.filter((b) => b.id != null && b.name)

  if (usable.length === 0) return null

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {usable.map((brand) => (
        <li key={brand.id}>
          <Link
            href={`/brands/${brandSlug(brand.name!, brand.id!)}`}
            className="group flex h-28 flex-col items-center justify-center gap-3 rounded-card border border-hairline bg-surface px-3 transition duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_14px_30px_-22px_rgb(20_22_31_/_0.5)]"
          >
            <span className="relative flex h-10 w-full items-center justify-center">
              {brand.imageURL ? (
                <Image
                  src={brand.imageURL}
                  alt={brand.name!}
                  fill
                  sizes="120px"
                  className="object-contain"
                />
              ) : (
                <span className="display-sm flex size-10 items-center justify-center rounded-chip bg-ground text-sm text-ground-ink">
                  {brandMonogram(brand.name)}
                </span>
              )}
            </span>
            <span className="line-clamp-1 text-center text-xs font-medium text-ink-muted transition-colors group-hover:text-ink">
              {brand.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
