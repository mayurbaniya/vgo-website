'use client'

import { useState } from 'react'
import { formatInr } from '@/lib/format'
import { EmiCalculator } from './emi-calculator'
import { OnRoadEstimator, type EstimatorCity } from './onroad-estimator'

export interface PickableModel {
  id: number
  title: string
  price: number
  ev: boolean
  cc: number | null
  kw: number | null
}

/**
 * A model chooser in front of one of the calculators.
 *
 * Both tools work on a plain number, so a standalone page could just show a
 * slider. But nobody arrives at an EMI calculator with a number — they arrive
 * with a bike. Picking the model fills the price in and, on the on-road tool,
 * also supplies the displacement that decides the third-party insurance slab,
 * which a bare number cannot.
 *
 * The list is small enough (the whole catalog) to be a select rather than a
 * search: a dropdown you can scan beats a field you have to guess at.
 */
export function ModelPicker({
  models,
  tool,
  cities = [],
}: {
  models: PickableModel[]
  tool: 'emi' | 'on-road'
  /** Live cities, for the on-road tool. Ignored by the EMI one. */
  cities?: EstimatorCity[]
}) {
  const [selectedId, setSelectedId] = useState<number | null>(
    models[0]?.id ?? null,
  )

  const model = models.find((entry) => entry.id === selectedId) ?? models[0] ?? null

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end gap-4 p-5">
        <label className="min-w-0 flex-1">
          <span className="micro text-ink-subtle">Model</span>
          <select
            value={model?.id ?? ''}
            onChange={(event) => setSelectedId(Number(event.target.value))}
            className="mt-1.5 block w-full cursor-pointer rounded-control border border-hairline bg-surface px-3 py-2.5 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none"
          >
            {models.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title} — {formatInr(entry.price)}
              </option>
            ))}
          </select>
        </label>

        {model && (
          <div className="text-right">
            <p className="micro text-ink-subtle">Ex-showroom</p>
            <p className="figure text-xl text-ink">{formatInr(model.price)}</p>
          </div>
        )}
      </div>

      {model &&
        (tool === 'emi' ? (
          // Remounted per model so the sliders reset to that price rather than
          // keeping the previous model's down payment against a new figure.
          <EmiCalculator key={model.id} price={model.price} />
        ) : (
          <OnRoadEstimator
            key={model.id}
            exShowroom={model.price}
            electric={model.ev}
            cc={model.cc}
            kw={model.kw}
            cities={cities}
          />
        ))}
    </div>
  )
}
