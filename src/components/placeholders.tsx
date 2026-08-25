import Link from 'next/link'
import { GetAppButton } from './get-app-button'
import { Stars } from './reviews'
import { SITE_NAME } from '@/lib/site'

/**
 * Modules for things the product does not have yet.
 *
 * The portals this site is measured against lean heavily on owner reviews,
 * dealer networks and used listings. VGO has none of those: there is no review
 * table, no showroom table and no used inventory anywhere in the API or the
 * admin panel.
 *
 * So these say so. A rating out of five with no ratings behind it, or a
 * "500+ dealers" strip with no dealers, is the one kind of thing that would
 * make this site less trustworthy rather than more complete — and it is exactly
 * what a reader checks first. An empty state that explains itself and offers
 * the next best move costs nothing and reads as a product that is early, which
 * is true.
 */

/**
 * The home page's invitation to review.
 *
 * This used to say "no owner reviews yet", which was true of what the website
 * could see and false about the database — the reviews existed, they were just
 * behind an authenticated endpoint. Per-vehicle reviews now render on the
 * vehicle page from the public API (components/reviews.tsx).
 *
 * This one stays a prompt rather than becoming a feed, because there is no
 * cross-vehicle "recent reviews" route to build a feed from, and inventing the
 * count would repeat the original mistake in the other direction. It states
 * where reviews come from and asks for one — both of which are true whatever
 * the table holds.
 */
export function ReviewsPanel() {
  return (
    <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-card bg-surface-alt">
          <Stars rating={0} size="lg" />
        </div>
        <div>
          <h3 className="display-sm text-base text-ink">
            Reviews come from owners
          </h3>
          <p className="mt-1 max-w-md text-sm text-ink-muted">
            Ratings on a model page are written by verified owners in the{' '}
            {SITE_NAME} app, and every one of them is attached to a bike someone
            actually rides. Open any model to read them.
          </p>
        </div>
      </div>

      <div className="shrink-0 self-start sm:self-auto sm:text-right">
        <p className="mb-2 text-xs font-semibold text-ink-muted">Own one?</p>
        <GetAppButton label={`Review your vehicle in the ${SITE_NAME} app on Google Play`} />
      </div>
    </div>
  )
}

export function ComingSoonBand({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string
  title: string
  body: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-col gap-5 rounded-card border border-hairline bg-surface-alt p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div>
        <p className="micro text-signal">{eyebrow}</p>
        <h3 className="display mt-2 text-xl text-ink sm:text-2xl">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>

      {action && (
        <Link
          href={action.href}
          className="shrink-0 self-start rounded-control border border-hairline bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/25 sm:self-auto"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
