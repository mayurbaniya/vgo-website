import Link from 'next/link'
import type { IndexedVehicle } from '@/lib/catalog'
import { VehicleCard } from './vehicle-card'

export function VehicleGrid({
  vehicles,
  today,
  view = 'grid',
  emptyMessage = 'Nothing here yet. Check back soon.',
}: {
  vehicles: IndexedVehicle[]
  today: number
  view?: 'grid' | 'list'
  emptyMessage?: string
}) {
  if (vehicles.length === 0) return <EmptyState message={emptyMessage} />

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {vehicles.map((entry, i) => (
          <VehicleCard
            key={entry.id}
            entry={entry}
            today={today}
            variant="list"
            priority={i < 2}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((entry, i) => (
        <VehicleCard
          key={entry.id}
          entry={entry}
          today={today}
          // The first row is above the fold on every listing; letting those
          // images queue behind the rest costs the page its LCP.
          priority={i < 4}
        />
      ))}
    </div>
  )
}

/**
 * A horizontally scrolling row of cards, for the home page rails.
 *
 * A rail rather than a grid where the section is a taste of a bigger list:
 * eight cards in a grid claim to be the whole set, eight in a rail that runs
 * off the edge say there are more, which is true and is also the click.
 */
export function VehicleRail({
  vehicles,
  today,
}: {
  vehicles: IndexedVehicle[]
  today: number
}) {
  if (vehicles.length === 0) return null

  return (
    <ul className="rail -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      {vehicles.map((entry, i) => (
        <li key={entry.id} className="w-[16rem] sm:w-[17.5rem]">
          <VehicleCard entry={entry} today={today} priority={i < 3} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Empty states get the same care as populated ones: say what's missing, then
 * offer the nearest useful move rather than leaving a dead end.
 */
export function EmptyState({
  message,
  action,
}: {
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-card border border-dashed border-hairline bg-surface-alt/50 px-6 py-16 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  tone = 'light',
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className={`micro mb-2 ${dark ? 'text-signal' : 'text-signal'}`}>
            {eyebrow}
          </p>
        )}
        <h2
          className={`display text-2xl sm:text-[1.75rem] ${
            dark ? 'text-ground-ink' : 'text-ink'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-1.5 max-w-2xl text-sm ${
              dark ? 'text-ground-muted' : 'text-ink-muted'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

/** "See all →" — the same link treatment on every section header. */
export function SectionLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="shrink-0 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-500"
    >
      {children} →
    </Link>
  )
}

/** Placeholder that matches the real card's proportions, not a plain block. */
export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="shimmer aspect-4/3" />
      <div className="space-y-2.5 p-4">
        <div className="shimmer h-2.5 w-20 rounded" />
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-5 w-1/2 rounded" />
        <div className="shimmer h-10 rounded" />
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="rail">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[16rem] sm:w-[17.5rem]">
          <CardSkeleton />
        </div>
      ))}
    </div>
  )
}
