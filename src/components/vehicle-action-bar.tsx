'use client'

import { useCompare } from '@/lib/use-compare'

/**
 * The sticky price bar on a model page, phones only.
 *
 * A vehicle page is long, and on a phone the price scrolls off after the first
 * screen — so the one number the whole page is about stops being visible
 * exactly when the reader is deciding. Every portal in this category pins it.
 *
 * It hides itself while the compare tray is up. Both are fixed to the bottom of
 * the viewport and the tray is the more recently expressed intent: someone
 * mid-shortlist is comparing, not buying this one right now.
 */
export function VehicleActionBar({
  price,
  note,
}: {
  price: string
  note: string
}) {
  const { ids } = useCompare()
  if (ids.length > 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur lg:hidden print:hidden">
      <div className="shell flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="figure truncate text-lg text-ink">{price}</p>
          <p className="micro truncate text-ink-subtle">{note}</p>
        </div>
        <a href="#price" className="btn-primary shrink-0 px-4 py-2.5 text-sm">
          On-road price
        </a>
      </div>
    </div>
  )
}
