import Image from 'next/image'
import Link from 'next/link'
import type { Offer } from '@/lib/types'

/**
 * A dealer offer.
 *
 * `benefitText` is the whole point of the card — "Rs 3,000 off" is what makes
 * someone stop — so it is set as a figure on its own line above the title
 * rather than buried in the description, which is where the old card put it.
 * The offer type and the end date sit underneath, because an offer with no
 * visible expiry reads as decoration rather than as something to act on.
 */
export function OfferCard({
  offer,
  expanded = false,
}: {
  offer: Offer
  /** On /offers the terms belong on the card; on a rail they belong behind a link. */
  expanded?: boolean
}) {
  const ends = formatEnds(offer.endsAt)

  return (
    <article className="card card-interactive flex h-full flex-col overflow-hidden">
      {offer.imageURL && (
        <div className="relative aspect-video bg-surface-alt">
          <Image
            src={offer.imageURL}
            alt=""
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
          {offer.offerType && (
            <span className="micro absolute left-3 top-3 rounded-chip bg-ground/85 px-2 py-1 text-ground-ink backdrop-blur">
              {offerTypeLabel(offer.offerType)}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        {offer.benefitText && (
          <p className="figure text-xl text-signal">{offer.benefitText}</p>
        )}

        <h3 className="display-sm clamp-2 mt-1 text-[0.9375rem] leading-snug text-ink">
          {offer.title}
        </h3>

        {offer.description && (
          <p className="clamp-2 mt-1.5 text-sm text-ink-muted">{offer.description}</p>
        )}

        {expanded && offer.termsAndConditions && (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none text-xs font-semibold text-brand-700">
              Terms and conditions
              <span aria-hidden className="ml-1 inline-block transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-ink-subtle">
              {offer.termsAndConditions}
            </p>
          </details>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="micro text-ink-subtle">{ends ?? 'While stocks last'}</span>
          {!expanded && (
            <Link href="/offers" className="text-xs font-semibold text-brand-700 hover:underline">
              Terms →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

/** DISCOUNT / EXCHANGE_BONUS / … as something a person would say. */
function offerTypeLabel(raw: string): string {
  const words = raw.trim().toLowerCase().split(/[_\s]+/).filter(Boolean)
  if (words.length === 0) return raw
  return words.join(' ').replace(/^./, (c) => c.toUpperCase())
}

/**
 * "Ends 18 Sep".
 *
 * Formatted from the offer's own timestamp, not compared against the clock —
 * a component that reads the current time cannot be prerendered, and the API
 * only returns offers that are live anyway.
 */
function formatEnds(raw?: string): string | null {
  if (!raw) return null
  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed)) return null

  return `Ends ${new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parsed)}`
}
