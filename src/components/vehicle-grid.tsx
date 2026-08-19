import type { Vehicle } from '@/lib/types'
import { VehicleCard } from './vehicle-card'

export function VehicleGrid({
  vehicles,
  emptyMessage = 'Nothing here yet. Check back soon.',
}: {
  vehicles: Vehicle[]
  emptyMessage?: string
}) {
  if (vehicles.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
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
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="micro mb-2 text-signal">{eyebrow}</p>}
        <h2 className="display text-2xl text-ink sm:text-[1.75rem]">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/** Placeholder that matches the real card's proportions, not a plain block. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-hairline">
      <div className="aspect-4/3 animate-pulse bg-surface-alt" />
      <div className="space-y-2 p-4">
        <div className="h-2.5 w-20 animate-pulse rounded bg-hairline" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-hairline" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-hairline" />
        <div className="h-10 animate-pulse rounded bg-surface-alt" />
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
