'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Catalog search.
 *
 * Rendered as a real GET form pointed at /search, so it still works with the
 * URL alone if JavaScript hasn't loaded; the submit handler upgrades it to a
 * client navigation when it has.
 */
export function SearchBox({
  size = 'compact',
  autoFocus = false,
  placeholder = 'Search a model — Duke, Activa, Classic 350…',
}: {
  size?: 'compact' | 'hero'
  autoFocus?: boolean
  placeholder?: string
}) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const hero = size === 'hero'

  return (
    <form
      action="/search"
      method="get"
      onSubmit={(event) => {
        const query = value.trim()
        if (!query) {
          event.preventDefault()
          return
        }
        event.preventDefault()
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }}
      role="search"
      className={
        hero
          ? 'flex w-full items-center gap-2 rounded-control border border-white/15 bg-white/10 p-2 backdrop-blur focus-within:border-brand-glow/70'
          : 'flex items-center gap-2 rounded-control border border-white/12 bg-white/8 px-3 focus-within:border-brand-glow/70'
      }
    >
      <SearchIcon
        className={
          hero ? 'ml-2 size-5 shrink-0 text-white/50' : 'size-4 shrink-0 text-white/45'
        }
      />
      <label className="sr-only" htmlFor={hero ? 'search-hero' : 'search-header'}>
        Search vehicles
      </label>
      <input
        id={hero ? 'search-hero' : 'search-header'}
        name="q"
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={
          hero
            ? 'min-w-0 flex-1 bg-transparent py-2 text-base text-ground-ink placeholder:text-white/40 focus:outline-none'
            : 'min-w-0 flex-1 bg-transparent py-2 text-sm text-ground-ink placeholder:text-white/35 focus:outline-none'
        }
      />
      {hero && (
        <button
          type="submit"
          className="shrink-0 rounded-[6px] bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Search
        </button>
      )}
    </form>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}
