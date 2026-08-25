import Image from 'next/image'
import Link from 'next/link'
import type { IndexedVehicle } from '@/lib/catalog'
import { isNewlyLaunched } from '@/lib/catalog'
import { displayPrice, formatInr, specCells } from '@/lib/format'
import { CompareButton } from './compare-button'

/**
 * The catalog card.
 *
 * Structure changed from a single `<Link>` wrapper to an article with a
 * stretched-link overlay, because the card now carries a second control — the
 * compare toggle — and a button nested inside an anchor is invalid markup that
 * behaves differently in every browser. The overlay keeps the whole card
 * clickable while leaving room for controls that sit above it.
 *
 * Price is the loudest thing on the card and the spec cluster is the quietest,
 * in that order deliberately: the figure decides whether a shopper looks
 * further, the specs decide whether they click.
 */
export function VehicleCard({
  entry,
  today,
  variant = 'grid',
  priority = false,
}: {
  entry: IndexedVehicle
  today: number
  variant?: 'grid' | 'list'
  priority?: boolean
}) {
  return variant === 'list' ? (
    <ListCard entry={entry} today={today} priority={priority} />
  ) : (
    <GridCard entry={entry} today={today} priority={priority} />
  )
}

/**
 * Headline price.
 *
 * The catalog stores a range, and printing both bounds on a card makes every
 * price twice as long and half as scannable — so the card shows the entry price
 * with "onwards", which is the convention on every listing in the category, and
 * the full range lives on the vehicle page. Falls back to the raw formatted
 * string when the admin entry was not numeric.
 */
function priceLine(entry: IndexedVehicle): { value: string; note: string } | null {
  if (entry.priceMin === null) {
    const raw = displayPrice(entry.vehicle)
    return raw ? { value: raw, note: 'Ex-showroom' } : null
  }

  const ranged = entry.priceMax !== null && entry.priceMax > entry.priceMin
  return {
    value: formatInr(entry.priceMin),
    note: ranged ? 'onwards · ex-showroom' : 'Ex-showroom',
  }
}

function Badges({ entry, today }: { entry: IndexedVehicle; today: number }) {
  const fresh = isNewlyLaunched(entry, today)
  if (!entry.ev && !fresh) return null

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
      {entry.ev ? (
        <span className="micro rounded-chip bg-ev px-2 py-1 text-white">Electric</span>
      ) : (
        <span />
      )}
      {fresh && (
        <span className="micro rounded-chip bg-signal px-2 py-1 text-white">New</span>
      )}
    </div>
  )
}

function SpecCluster({
  entry,
  dark = false,
}: {
  entry: IndexedVehicle
  dark?: boolean
}) {
  const cells = specCells(entry.vehicle)
  if (cells.length === 0) return null

  return (
    <div className={`cluster ${dark ? 'cluster-dark' : ''}`}>
      {cells.map((cell) => (
        <div key={cell.label} className="px-4 first:pl-0">
          <div className="figure text-sm text-ink">{cell.value}</div>
          <div className="micro mt-0.5 text-ink-subtle">{cell.label}</div>
        </div>
      ))}
    </div>
  )
}

function GridCard({
  entry,
  today,
  priority,
}: {
  entry: IndexedVehicle
  today: number
  priority: boolean
}) {
  const image = entry.vehicle.images?.find(Boolean) ?? null
  const price = priceLine(entry)
  const eyebrow = [entry.brandName, entry.bodyLabel].filter(Boolean).join(' · ')

  return (
    <article className="card card-interactive group relative flex h-full flex-col overflow-hidden">
      <div className="plate relative aspect-4/3 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={entry.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="micro flex h-full items-center justify-center text-ink-subtle">
            Photo coming soon
          </div>
        )}
        <Badges entry={entry} today={today} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="micro text-ink-subtle">{eyebrow || 'Two-wheeler'}</p>

        <h3 className="clamp-2 display-sm mt-1.5 text-[1.0625rem] leading-snug text-ink transition-colors group-hover:text-brand-700">
          {/* The stretched link. Sitting on the title keeps the card's
              accessible name right without a redundant "read more" label. */}
          <Link href={entry.href} className="before:absolute before:inset-0">
            {entry.model}
          </Link>
        </h3>

        {price ? (
          <p className="mt-2">
            <span className="figure text-lg text-ink">{price.value}</span>
            <span className="micro ml-1.5 text-ink-subtle">{price.note}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-subtle">Price on request</p>
        )}

        <div className="mt-auto -mx-4 border-t border-hairline bg-surface-alt/60 px-4 pt-3 pb-3">
          <SpecCluster entry={entry} />
        </div>

        <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-hairline px-3 py-2">
          <CompareButton id={entry.id} />
          <span
            aria-hidden
            className="relative z-10 text-xs font-semibold text-ink-subtle transition-colors group-hover:text-brand-700"
          >
            View specs →
          </span>
        </div>
      </div>
    </article>
  )
}

/**
 * The list row.
 *
 * Same data, more of it: with the full width available it can show four spec
 * figures and both price bounds, which is what someone who switched out of the
 * grid was asking for.
 */
function ListCard({
  entry,
  today,
  priority,
}: {
  entry: IndexedVehicle
  today: number
  priority: boolean
}) {
  const image = entry.vehicle.images?.find(Boolean) ?? null
  const price = priceLine(entry)
  const eyebrow = [entry.brandName, entry.bodyLabel].filter(Boolean).join(' · ')

  return (
    <article className="card card-interactive group relative flex flex-col gap-4 overflow-hidden p-3 sm:flex-row sm:items-stretch">
      <div className="plate relative aspect-4/3 shrink-0 overflow-hidden rounded-[8px] sm:aspect-auto sm:w-56">
        {image ? (
          <Image
            src={image}
            alt={entry.title}
            fill
            priority={priority}
            sizes="(min-width: 640px) 224px, 90vw"
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="micro flex h-full items-center justify-center text-ink-subtle">
            Photo coming soon
          </div>
        )}
        <Badges entry={entry} today={today} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <p className="micro text-ink-subtle">{eyebrow || 'Two-wheeler'}</p>
          <h3 className="display-sm mt-1 text-lg text-ink transition-colors group-hover:text-brand-700">
            <Link href={entry.href} className="before:absolute before:inset-0">
              {entry.title}
            </Link>
          </h3>
          {entry.vehicle.variant && (
            <p className="mt-0.5 text-xs text-ink-subtle">{entry.vehicle.variant}</p>
          )}
        </div>

        <div className="border-t border-hairline pt-3">
          <SpecCluster entry={entry} />
        </div>
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-hairline pt-3 sm:w-44 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        {price ? (
          <div className="sm:text-right">
            <div className="figure text-xl text-ink">{price.value}</div>
            <div className="micro mt-0.5 text-ink-subtle">{price.note}</div>
          </div>
        ) : (
          <p className="text-sm text-ink-subtle">Price on request</p>
        )}
        <CompareButton id={entry.id} />
      </div>
    </article>
  )
}
