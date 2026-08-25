'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { compareHref, writeCompare } from '@/lib/compare'
import { useCompare } from '@/lib/use-compare'

export interface CompareIndexEntry {
  id: number
  title: string
  image: string | null
}

/**
 * The shortlist tray.
 *
 * Mounted once in the layout and empty until something is added, so it costs
 * nothing on a page nobody is comparing on. It exists because the compare
 * toggle on a card is otherwise a click into the void: you tick three bikes
 * across two listing pages and have no idea the site is holding them.
 *
 * `index` is the whole catalog reduced to id, name and thumbnail. Passing it
 * down from the server is what lets the tray show "Bajaj Pulsar NS200" instead
 * of "#5" — localStorage holds ids only, and looking each one up over the
 * network to label a chip would be four requests for four words.
 */
export function CompareTray({ index }: { index: CompareIndexEntry[] }) {
  const { ids, toggle, max } = useCompare()
  const pathname = usePathname()

  // The compare page is the tray's destination; keeping it pinned there would
  // cover the table it just took you to.
  if (pathname === '/compare' || ids.length === 0) return null

  const picked = ids
    .map((id) => index.find((entry) => entry.id === id))
    .filter((entry): entry is CompareIndexEntry => entry !== undefined)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden">
      <div className="shell pb-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-card border border-ground-line bg-ground/95 p-3 shadow-pop backdrop-blur sm:flex-nowrap">
          <p className="micro shrink-0 text-white/40">
            Compare · {ids.length}/{max}
          </p>

          <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {picked.map((entry) => (
              <li
                key={entry.id}
                className="flex shrink-0 items-center gap-2 rounded-chip border border-white/12 bg-white/5 py-1 pl-1 pr-2"
              >
                <span className="plate-dark relative size-8 shrink-0 overflow-hidden rounded-[4px]">
                  {entry.image && (
                    <Image
                      src={entry.image}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-contain p-0.5"
                    />
                  )}
                </span>
                <span className="max-w-36 truncate text-xs text-ground-ink">
                  {entry.title}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(entry.id)}
                  aria-label={`Remove ${entry.title} from compare`}
                  className="text-white/40 transition-colors hover:text-white"
                >
                  <svg viewBox="0 0 14 14" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="m3.5 3.5 7 7m0-7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => writeCompare([])}
              className="px-2 py-2 text-xs font-semibold text-white/45 transition-colors hover:text-white"
            >
              Clear
            </button>
            <Link
              href={compareHref(ids)}
              className="btn-primary px-4 py-2 text-sm"
              // Two columns is the minimum a comparison means anything at.
              aria-disabled={ids.length < 2}
              onClick={(event) => {
                if (ids.length < 2) event.preventDefault()
              }}
            >
              {ids.length < 2 ? 'Add one more' : 'Compare'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
