'use client'

import { useState } from 'react'
import { BODY_FILTERS, BUDGET_BUCKETS, CC_BUCKETS } from '@/lib/filters'

export interface BrandOption {
  id: number
  name: string
}

/**
 * The hero's find-a-bike widget.
 *
 * Three ways in, because people arrive knowing one of three things: the model
 * they want, the money they have, or the badge they trust. A single search box
 * only serves the first, and the other two are most of the traffic — which is
 * why every portal in this category leads with a widget rather than a field.
 *
 * Each mode is a plain GET form pointed at a real listing URL, so all three
 * work with JavaScript switched off and each produces a link that can be
 * shared. The only thing this component holds in state is which tab is showing.
 */
export function HeroSearch({ brands }: { brands: BrandOption[] }) {
  const [mode, setMode] = useState<'name' | 'budget' | 'brand'>('name')

  return (
    <div>
      <div role="tablist" aria-label="Search mode" className="seg seg-dark mb-3">
        {(
          [
            ['name', 'By name'],
            ['budget', 'By budget'],
            ['brand', 'By brand'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            data-active={mode === key}
            onClick={() => setMode(key)}
            className="seg-item"
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'name' && (
        <form
          action="/search"
          method="get"
          role="search"
          className="flex w-full items-center gap-2 rounded-control border border-white/15 bg-white/10 p-2 backdrop-blur focus-within:border-brand-glow/70"
        >
          <SearchIcon className="ml-2 size-5 shrink-0 text-white/50" />
          <label className="sr-only" htmlFor="hero-q">
            Search vehicles
          </label>
          <input
            id="hero-q"
            name="q"
            type="search"
            placeholder="Search a model — Duke, Activa, Classic 350…"
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-ground-ink placeholder:text-white/40 focus:outline-none"
          />
          <button type="submit" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
            Search
          </button>
        </form>
      )}

      {mode === 'budget' && (
        <form
          action="/bikes"
          method="get"
          className="flex flex-col gap-2 rounded-control border border-white/15 bg-white/10 p-2 backdrop-blur sm:flex-row sm:items-center"
        >
          <Field label="Budget" name="budget" options={BUDGET_BUCKETS} anyLabel="Any budget" />
          <Field label="Engine" name="cc" options={CC_BUCKETS} anyLabel="Any engine size" />
          <button type="submit" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
            Show bikes
          </button>
        </form>
      )}

      {mode === 'brand' && (
        <form
          action="/bikes"
          method="get"
          className="flex flex-col gap-2 rounded-control border border-white/15 bg-white/10 p-2 backdrop-blur sm:flex-row sm:items-center"
        >
          <Field
            label="Brand"
            name="brand"
            options={brands.map((brand) => ({
              key: String(brand.id),
              label: brand.name,
            }))}
            anyLabel="Any brand"
          />
          <Field label="Type" name="body" options={BODY_FILTERS} anyLabel="Any body style" />
          <button type="submit" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
            Show bikes
          </button>
        </form>
      )}
    </div>
  )
}

/**
 * A select on dark ground.
 *
 * The empty option carries an empty value, so leaving it alone submits nothing
 * for that key and the resulting URL has no dead `?brand=` in it.
 */
function Field({
  label,
  name,
  options,
  anyLabel,
}: {
  label: string
  name: string
  options: { key: string; label: string }[]
  anyLabel: string
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[6px] px-3 py-1.5 focus-within:bg-white/5">
      <span className="micro shrink-0 text-white/40">{label}</span>
      <select
        name={name}
        defaultValue=""
        className="min-w-0 flex-1 cursor-pointer bg-transparent py-1.5 text-sm text-ground-ink focus:outline-none [&>option]:bg-ground [&>option]:text-ground-ink"
      >
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
