'use client'

import { useMemo, useState } from 'react'
import { formatInr } from '@/lib/format'
import { cityLabel, estimateOnRoad, slabForCity } from '@/lib/pricing'

export interface EstimatorCity {
  id: number
  /** As stored, e.g. "NAGPUR". Displayed through `cityLabel`. */
  name: string
}

/**
 * The on-road price estimator.
 *
 * Ex-showroom is the number the catalog holds and the number nobody actually
 * pays. The gap — state road tax, five-year third-party cover, registration —
 * is twelve to twenty per cent, varies by state, and is the single most common
 * thing a two-wheeler shopper searches for after the model name.
 *
 * The city list comes from the backend, not from this file. It used to come
 * from the same table as the tax rates, which meant the tool offered twelve
 * cities while the database held one — it advertised coverage the business did
 * not have. Cities are a fact about the product; tax rates are a fact about the
 * law. They are now two different tables and only the first is authoritative
 * about what to show.
 *
 * Figures are itemised rather than totalled because this is arithmetic over
 * published slabs, not a dealer quote, and showing the working is what makes
 * that legible. See the header of lib/pricing.ts.
 */
export function OnRoadEstimator({
  exShowroom,
  electric,
  cc,
  kw,
  cities,
  compact = false,
}: {
  exShowroom: number
  electric: boolean
  cc?: number | null
  kw?: number | null
  /** Live cities from the catalog. Empty means the tool cannot run. */
  cities: EstimatorCity[]
  compact?: boolean
}) {
  const [cityId, setCityId] = useState(cities[0]?.id)

  const city = cities.find((entry) => entry.id === cityId) ?? cities[0]
  const slab = city ? slabForCity(city.name) : null

  const estimate = useMemo(
    () => (slab ? estimateOnRoad({ exShowroom, slab, electric, cc, kw }) : null),
    [exShowroom, slab, electric, cc, kw],
  )

  if (!city) {
    return (
      <div className={compact ? '' : 'card p-6 sm:p-8'}>
        <p className="text-sm text-ink-muted">
          No cities are on file yet, so there is nothing to price against. The
          ex-showroom figure above is the same in every city; on-road adds state
          road tax, insurance and registration on top.
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'card p-6 sm:p-8'}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/*
          One city is a fact, not a choice. Rendering a select with a single
          option is the interface equivalent of asking a question you already
          know the answer to — so below two cities this states the city instead.
        */}
        {cities.length > 1 ? (
          <label className="block">
            <span className="micro text-ink-subtle">City</span>
            <select
              value={city.id}
              onChange={(event) => setCityId(Number(event.target.value))}
              className="mt-1.5 block w-56 cursor-pointer rounded-control border border-hairline bg-surface px-3 py-2.5 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none"
            >
              {cities.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {cityLabel(entry.name)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div>
            <p className="micro text-ink-subtle">City</p>
            <p className="display-sm mt-1.5 text-lg text-ink">
              {cityLabel(city.name)}
              {slab && (
                <span className="ml-2 text-sm font-normal text-ink-subtle">
                  {slab.state}
                </span>
              )}
            </p>
          </div>
        )}

        {estimate && (
          <div className="text-right">
            <p className="micro text-ink-subtle">Estimated on-road</p>
            <p className="figure text-3xl text-ink">{formatInr(estimate.total)}</p>
          </div>
        )}
      </div>

      {estimate ? (
        <>
          <dl className="mt-6 divide-y divide-hairline border-t border-hairline">
            <Line label="Ex-showroom price" amount={estimate.exShowroom} />
            {estimate.lines.map((line) => (
              <Line
                key={line.label}
                label={line.label}
                note={line.note}
                amount={line.amount}
              />
            ))}
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="display-sm text-base text-ink">
                On-road, {cityLabel(city.name)}
              </dt>
              <dd className="figure tnum text-xl text-ink">
                {formatInr(estimate.total)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
            An estimate, not a quote. Road tax is a state slab applied to
            ex-showroom; insurance uses the IRDAI third-party premium for this
            vehicle plus a working figure for own damage. Dealers add
            accessories, extended warranty and handling on top, and offers come
            off — ask a showroom for the final figure.
          </p>
        </>
      ) : (
        /*
          A city with no slab on file. Saying so beats substituting a national
          average, which would look like an answer and be wrong by thousands of
          rupees in either direction.
        */
        <div className="mt-6 rounded-card border border-hairline bg-surface-alt p-5">
          <p className="text-sm font-semibold text-ink">
            We don&apos;t have {cityLabel(city.name)}&apos;s road tax slab yet
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Road tax is set per state and we would rather show nothing than a
            guess. Ex-showroom is {formatInr(exShowroom)}; expect roughly 12–20%
            on top once road tax, insurance and registration are added, and ask
            the dealer for the exact breakdown.
          </p>
        </div>
      )}
    </div>
  )
}

function Line({
  label,
  amount,
  note,
}: {
  label: string
  amount: number
  note?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt>
        <span className="text-sm text-ink-muted">{label}</span>
        {note && <span className="mt-0.5 block text-xs text-ink-subtle">{note}</span>}
      </dt>
      <dd className="tnum shrink-0 text-sm font-semibold text-ink">
        {amount === 0 ? 'Nil' : formatInr(amount)}
      </dd>
    </div>
  )
}
