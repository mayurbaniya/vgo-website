'use client'

import { useEffect, useRef } from 'react'

/**
 * A menu of links that opens under its trigger.
 *
 * Built on `<details>` rather than on React state, so the sort and view menus
 * open and close with no JavaScript at all — and, more importantly, so every
 * option inside is a real `<a>` present in the document whether the menu is
 * open or not. A crawler reading a listing page finds the sorted URLs; a reader
 * with a broken bundle can still change the sort.
 *
 * The effect below only adds what `<details>` lacks: closing when you click
 * away or press Escape. Enhancement, not the mechanism.
 */
export function Dropdown({
  label,
  value,
  align = 'right',
  children,
}: {
  label: string
  /** The current selection, shown next to the label on the trigger. */
  value?: string
  align?: 'left' | 'right'
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function close(event: Event) {
      const node = ref.current
      if (!node?.open) return
      if (event.target instanceof Node && node.contains(event.target)) return
      node.open = false
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const node = ref.current
      if (!node?.open) return
      node.open = false
      node.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <details ref={ref} className="group relative">
      <summary className="btn-ghost cursor-pointer list-none">
        <span className="text-ink-subtle">{label}</span>
        {value && <span className="text-ink">{value}</span>}
        <span
          aria-hidden
          className="transition-transform duration-200 group-open:rotate-180"
        >
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
          </svg>
        </span>
      </summary>

      <div
        className={`absolute z-30 mt-2 min-w-56 overflow-hidden rounded-card border border-hairline bg-surface p-1 shadow-pop ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {children}
      </div>
    </details>
  )
}

/** One row inside a Dropdown. Rendered by the caller as a `<Link>` child. */
export function DropdownItem({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <span
      className={`flex items-center justify-between gap-3 rounded-chip px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-brand-50 font-semibold text-brand-700'
          : 'text-ink-muted hover:bg-surface-alt hover:text-ink'
      }`}
    >
      {children}
      {active && (
        <svg viewBox="0 0 12 12" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2.5 6.2 2.4 2.4 4.6-5" />
        </svg>
      )}
    </span>
  )
}
