import Link from 'next/link'
import { GridSkeleton } from './vehicle-grid'

/**
 * Listing masthead.
 *
 * Dark, so every listing opens against the same frame the header and hero
 * establish and the white catalog below reads as content rather than as more
 * chrome. Filtering, sorting and the results themselves all live in
 * <CatalogBrowser>; this is only the page's statement of what it is.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  count,
  breadcrumbs,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  count?: number
  breadcrumbs?: { href: string; label: string }[]
  children?: React.ReactNode
}) {
  return (
    <header className="bg-ground">
      <div className="shell py-10 sm:py-12">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ground-muted">
              {breadcrumbs.map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  <Link href={crumb.href} className="transition-colors hover:text-ground-ink">
                    {crumb.label}
                  </Link>
                  <span aria-hidden className="text-white/25">
                    /
                  </span>
                </li>
              ))}
              <li className="text-ground-ink">{title}</li>
            </ol>
          </nav>
        )}

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

/**
 * Fallback for a listing route's Suspense boundary. Mirrors the browser's own
 * two-column shape so the rail does not appear from nowhere once data lands.
 */
export function ListingSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div className="hidden space-y-6 lg:block">
        {Array.from({ length: 4 }, (_, group) => (
          <div key={group} className="space-y-2">
            <div className="shimmer h-3 w-24 rounded" />
            {Array.from({ length: 4 }, (_, row) => (
              <div key={row} className="shimmer h-7 rounded" />
            ))}
          </div>
        ))}
      </div>
      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between border-b border-hairline pb-4">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-9 w-40 rounded" />
        </div>
        <GridSkeleton />
      </div>
    </div>
  )
}
