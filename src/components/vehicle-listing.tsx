import Link from 'next/link'
import type { Paged, Vehicle } from '@/lib/types'
import { GridSkeleton, VehicleGrid } from './vehicle-grid'

export const PAGE_SIZE = 24

/** Parses ?page=N (1-based in the URL) into a 0-based API page index. */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const n = Number.parseInt(value ?? '1', 10)
  return Number.isSafeInteger(n) && n > 0 ? n - 1 : 0
}

export function VehicleListing({
  page,
  basePath,
  emptyMessage,
}: {
  page: Paged<Vehicle> | null
  basePath: string
  emptyMessage?: string
}) {
  const vehicles = page?.content ?? []
  const current = page?.pageNumber ?? 0
  const total = page?.totalPages ?? 0
  const count = page?.totalElements ?? 0

  return (
    <>
      {/* Sits with the results rather than in the masthead: the masthead is
          part of the static shell and cannot know the count without giving up
          its prerender. */}
      {count > 0 && (
        <p className="micro tnum mb-6 text-ink-subtle">
          {count} {count === 1 ? 'model' : 'models'}
          {total > 1 ? ` · page ${current + 1} of ${total}` : ''}
        </p>
      )}
      <VehicleGrid vehicles={vehicles} emptyMessage={emptyMessage} />
      <Pagination basePath={basePath} current={current} total={total} />
    </>
  )
}

function Pagination({
  basePath,
  current,
  total,
}: {
  basePath: string
  current: number
  total: number
}) {
  if (total <= 1) return null

  const prev = current > 0 ? current : null
  const next = current + 1 < total ? current + 2 : null

  const step =
    'rounded-control border border-hairline px-4 py-2 text-sm font-medium transition-colors'

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-3"
    >
      {/*
        Real <a> links with ?page=N rather than a client-side "load more".
        Crawlers follow hrefs; they do not click buttons, and every vehicle
        needs to sit behind a crawlable URL to get indexed.
      */}
      {prev !== null ? (
        <Link
          href={prev === 1 ? basePath : `${basePath}?page=${prev}`}
          rel="prev"
          className={`${step} text-ink-muted hover:border-ink/25 hover:text-ink`}
        >
          ← Previous
        </Link>
      ) : (
        <span className={`${step} text-ink-subtle opacity-40`}>← Previous</span>
      )}

      <span className="micro tnum text-ink-subtle">
        Page {current + 1} / {total}
      </span>

      {next !== null ? (
        <Link
          href={`${basePath}?page=${next}`}
          rel="next"
          className={`${step} text-ink-muted hover:border-ink/25 hover:text-ink`}
        >
          Next →
        </Link>
      ) : (
        <span className={`${step} text-ink-subtle opacity-40`}>Next →</span>
      )}
    </nav>
  )
}

/**
 * Listing masthead.
 *
 * Dark, so every listing opens against the same frame the header and hero
 * establish, and the white catalog below reads as the content rather than as
 * more chrome. `count` is shown when the caller knows it — "75 models" tells
 * someone whether it is worth scrolling.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  count,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  count?: number
  children?: React.ReactNode
}) {
  return (
    <header className="bg-ground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        {eyebrow && <p className="micro mb-3 text-signal">{eyebrow}</p>}
        <h1 className="display text-[2rem] text-ground-ink sm:text-[2.75rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ground-muted sm:text-base">
          {description}
        </p>
        {count !== undefined && count > 0 && (
          <p className="micro tnum mt-5 text-white/40">
            {count} {count === 1 ? 'model' : 'models'} listed
          </p>
        )}
        {children}
      </div>
    </header>
  )
}

/** Kept as a named export so listing routes can drop in a matching fallback. */
export function ListingSkeleton() {
  return <GridSkeleton />
}
