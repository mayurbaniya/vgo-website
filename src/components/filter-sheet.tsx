'use client'

import { useEffect, useState } from 'react'

/**
 * The filter rail, as a bottom sheet, below `lg`.
 *
 * The rail itself is a server component — the sheet takes it as `children` and
 * only supplies the open/close shell. That is what keeps all the faceting logic
 * and all the counts on the server: the client bundle here is a button, a
 * scrim and an Escape handler, and the same markup serves both breakpoints
 * instead of a second mobile-only copy that drifts out of step.
 *
 * On a phone this is not a nicety. A listing with no visible way to narrow it
 * is the difference between a catalog you can shop and a wall of cards.
 */
export function FilterSheet({
  activeCount,
  children,
}: {
  activeCount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    // The sheet covers most of the screen; letting the page scroll underneath
    // it makes the list jump to a different place than you left it.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost lg:hidden"
      >
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="tnum ml-0.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[0.6875rem] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="scrim absolute inset-0"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="sheet relative flex max-h-[85vh] flex-col"
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h2 className="display-sm text-base text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink-subtle transition-colors hover:text-ink"
              >
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="m4 4 8 8m0-8-8 8" />
                </svg>
              </button>
            </div>

            {/* Tapping any option navigates, which unmounts the sheet — so
                there is no "apply" button to get out of sync with the URL. */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) setOpen(false)
              }}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 4h12M4 8h8M6.5 12h3" />
    </svg>
  )
}
