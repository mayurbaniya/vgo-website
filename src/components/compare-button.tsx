'use client'

import { useState } from 'react'
import { useCompare } from '@/lib/use-compare'

/**
 * The add-to-compare toggle that sits on every card and on the vehicle page.
 *
 * A button rather than a checkbox: the card is one big link, and a real
 * checkbox inside it would be reachable by tab but would also fight the link
 * for the click. This stops propagation instead, so pressing it never navigates
 * — the single most annoying failure mode of a control placed on a card.
 *
 * When the shortlist is full it says so for a moment rather than doing nothing.
 * A toggle that silently refuses reads as broken.
 */
export function CompareButton({
  id,
  variant = 'card',
}: {
  id: number
  variant?: 'card' | 'inline'
}) {
  const { has, toggle, max } = useCompare()
  const [full, setFull] = useState(false)
  const selected = has(id)

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (toggle(id) === 'full') {
      setFull(true)
      window.setTimeout(() => setFull(false), 2200)
    }
  }

  const label = full
    ? `Compare holds ${max}`
    : selected
      ? 'Added to compare'
      : 'Add to compare'

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={selected}
        className={`btn-ghost ${selected ? 'border-ink/25 bg-surface-alt text-ink' : ''}`}
      >
        <TickIcon selected={selected} />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      // relative + z-10 lifts it above the card's stretched link overlay.
      className={`relative z-10 inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-xs font-semibold transition-colors ${
        full
          ? 'text-danger'
          : selected
            ? 'text-brand-700'
            : 'text-ink-subtle hover:text-ink'
      }`}
    >
      <TickIcon selected={selected} />
      {full ? `Max ${max}` : selected ? 'Added' : 'Compare'}
    </button>
  )
}

function TickIcon({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        selected
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-current opacity-60'
      }`}
    >
      {selected && (
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2.5 6.2 2.4 2.4 4.6-5" />
        </svg>
      )}
    </span>
  )
}
