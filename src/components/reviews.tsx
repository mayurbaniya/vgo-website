import { GetAppButton } from './get-app-button'
import { SITE_NAME } from '@/lib/site'
import type { Review, ReviewSummary } from '@/lib/types'

/**
 * Owner reviews for one vehicle.
 *
 * Replaces the placeholder that used to sit here. That placeholder was not
 * wrong to exist — at the time the public API published no reviews at all, so
 * the site genuinely could not see any. It was wrong about the world: it told
 * every visitor there were no reviews for models that had them.
 *
 * The rule it was built on still holds, and this component keeps it: a rating
 * is only ever drawn from reviews that exist. There is no default score, no
 * "4.2 based on nothing", and a vehicle with an empty review table still says
 * so plainly.
 */
export function VehicleReviews({
  subject,
  summary,
  reviews,
}: {
  /** Model name, for the empty state's copy. */
  subject: string
  summary: ReviewSummary | null
  reviews: Review[]
}) {
  const total = summary?.totalReviews ?? 0

  if (total === 0 && reviews.length === 0) {
    return <NoReviews subject={subject} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-10">
      {summary && total > 0 && <Summary summary={summary} total={total} />}

      <ul className="space-y-4">
        {reviews.map((review, i) => (
          <li key={review.id ?? i} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Stars rating={review.rating ?? 0} />
                <span className="text-sm font-semibold text-ink">
                  {review.reviewer?.trim() || 'VGO owner'}
                </span>
              </div>
              {review.created && (
                <span className="micro text-ink-subtle">
                  {formatPosted(review.created)}
                </span>
              )}
            </div>

            {review.comment && (
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {review.comment}
              </p>
            )}
          </li>
        ))}

        {total > reviews.length && (
          <li className="rounded-card border border-dashed border-hairline px-5 py-4 text-center">
            <p className="text-sm text-ink-muted">
              Showing {reviews.length} of {total} reviews. The rest are in the{' '}
              {SITE_NAME} app.
            </p>
          </li>
        )}
      </ul>
    </div>
  )
}

function Summary({
  summary,
  total,
}: {
  summary: ReviewSummary
  total: number
}) {
  const average = summary.averageRating ?? 0

  const buckets = [
    { stars: 5, count: summary.fiveStar ?? 0 },
    { stars: 4, count: summary.fourStar ?? 0 },
    { stars: 3, count: summary.threeStar ?? 0 },
    { stars: 2, count: summary.twoStar ?? 0 },
    { stars: 1, count: summary.oneStar ?? 0 },
  ]

  return (
    <div className="card h-fit p-5">
      <div className="flex items-baseline gap-2">
        <span className="figure text-4xl text-ink">{average.toFixed(1)}</span>
        <span className="text-sm text-ink-subtle">/ 5</span>
      </div>

      <div className="mt-2">
        <Stars rating={Math.round(average)} />
      </div>

      <p className="micro tnum mt-2 text-ink-subtle">
        {total} {total === 1 ? 'review' : 'reviews'}
      </p>

      {/*
        The distribution, not just the mean. A 4.0 built from straight fours
        and a 4.0 built from fives and ones are different bikes, and the bars
        are the only place that shows.
      */}
      <ul className="mt-5 space-y-1.5">
        {buckets.map((bucket) => (
          <li key={bucket.stars} className="flex items-center gap-2.5">
            <span className="tnum w-3 text-xs text-ink-subtle">{bucket.stars}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunk">
              <span
                className="block h-full rounded-full bg-signal"
                style={{ width: `${total > 0 ? (bucket.count / total) * 100 : 0}%` }}
              />
            </span>
            <span className="tnum w-6 text-right text-xs text-ink-subtle">
              {bucket.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NoReviews({ subject }: { subject: string }) {
  return (
    <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-card bg-surface-alt">
          <Stars rating={0} size="lg" />
        </div>
        <div>
          <h3 className="display-sm text-base text-ink">
            No reviews for the {subject} yet
          </h3>
          <p className="mt-1 max-w-md text-sm text-ink-muted">
            Ratings here come from verified owners in the {SITE_NAME} app.
            Nothing appears until someone writes one — a score with nobody
            behind it tells you less than an empty box.
          </p>
        </div>
      </div>

      <div className="shrink-0 self-start sm:self-auto sm:text-right">
        <p className="mb-2 text-xs font-semibold text-ink-muted">Own one?</p>
        <GetAppButton label={`Review the ${subject} in the ${SITE_NAME} app on Google Play`} />
      </div>
    </div>
  )
}

/**
 * Five stars, filled to the rating.
 *
 * Rendered as text-free SVG with an accessible label, so a screen reader hears
 * "4 out of 5" rather than five identical shapes.
 */
export function Stars({
  rating,
  size = 'sm',
}: {
  rating: number
  size?: 'sm' | 'lg'
}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={filled > 0 ? `${filled} out of 5` : 'Not yet rated'}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          aria-hidden
          className={`${size === 'lg' ? 'size-5' : 'size-3.5'} ${
            star <= filled ? 'text-signal' : 'text-hairline'
          }`}
          fill="currentColor"
        >
          <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </span>
  )
}

/** "12 Aug 2026". Parsed from the row's own timestamp — never the clock. */
function formatPosted(raw: string): string | null {
  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed)) return null

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}
