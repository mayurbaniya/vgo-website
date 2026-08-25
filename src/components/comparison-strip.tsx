import Image from 'next/image'
import Link from 'next/link'
import type { ComparisonPair, IndexedVehicle } from '@/lib/catalog'
import { compareHref } from '@/lib/compare'
import { compactInr } from '@/lib/format'

/**
 * Head-to-head cards.
 *
 * Shopping in this category is almost never "which bike" — it is "this one or
 * that one", and the two names are usually already decided. Putting the
 * matchups on the home page meets that question where it starts, and each card
 * is a direct link into the comparison table rather than into two model pages
 * the reader then has to hold in their head.
 *
 * Pairs come from `popularComparisons` in lib/catalog.ts, which builds them out
 * of the catalog rather than from a curated table nobody maintains.
 */
export function ComparisonStrip({ pairs }: { pairs: ComparisonPair[] }) {
  if (pairs.length === 0) return null

  return (
    <ul className="rail -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      {pairs.map((pair) => (
        <li key={`${pair.left.id}-${pair.right.id}`} className="w-[19rem]">
          <Link
            href={compareHref([pair.left.id, pair.right.id])}
            className="card card-interactive group flex h-full flex-col p-4"
          >
            <div className="flex items-center gap-2">
              <Side entry={pair.left} />
              <span className="display-sm shrink-0 rounded-full bg-ink px-2 py-1 text-[0.625rem] text-surface">
                VS
              </span>
              <Side entry={pair.right} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-hairline pt-3">
              <span className="micro text-ink-subtle">
                {pair.left.bodyLabel ?? 'Two-wheeler'}
              </span>
              <span className="text-xs font-semibold text-brand-700 transition-colors group-hover:text-brand-500">
                Compare specs →
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Side({ entry }: { entry: IndexedVehicle }) {
  const image = entry.vehicle.images?.find(Boolean) ?? null

  return (
    <div className="min-w-0 flex-1">
      <div className="plate relative aspect-4/3 overflow-hidden rounded-[8px]">
        {image && (
          <Image
            src={image}
            alt={entry.title}
            fill
            sizes="140px"
            className="object-contain p-2"
          />
        )}
      </div>
      <p className="clamp-2 mt-2 text-xs font-semibold leading-snug text-ink">
        {entry.title}
      </p>
      {entry.priceMin !== null && (
        <p className="figure mt-0.5 text-xs text-ink-muted">
          {compactInr(entry.priceMin)}
        </p>
      )}
    </div>
  )
}
