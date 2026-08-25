import type { IndexedVehicle, Metric } from '@/lib/catalog'
import { segmentStanding } from '@/lib/catalog'

/**
 * Key specs, in context.
 *
 * A spec sheet answers "what is it"; this answers "is that good", which is the
 * question a shopper actually has and the one a table of figures never gets to.
 * "195 kg" means nothing on its own. "195 kg — heavier than 71% of cruisers"
 * is a decision.
 *
 * The percentage is computed against the catalog's own rows for the same body
 * style (see `segmentStanding`), and disappears when there are too few peers
 * for it to mean anything. Nothing here is an editorial score.
 */
export function KeySpecs({
  entry,
  all,
}: {
  entry: IndexedVehicle
  all: IndexedVehicle[]
}) {
  const v = entry.vehicle

  const tiles: {
    metric: Metric
    label: string
    display: string | null
    lowerIsBetter?: boolean
    /** Wording for the comparison sentence. */
    better: string
    worse: string
  }[] = entry.ev
    ? [
        {
          metric: 'rangeKm',
          label: 'Certified range',
          display: v.certifiedRange ?? null,
          better: 'more range than',
          worse: 'less range than',
        },
        {
          metric: 'topSpeed',
          label: 'Top speed',
          display: v.topSpeed ?? null,
          better: 'faster than',
          worse: 'slower than',
        },
        {
          metric: 'weight',
          label: 'Kerb weight',
          display: v.weight != null ? String(v.weight) : null,
          lowerIsBetter: true,
          better: 'lighter than',
          worse: 'heavier than',
        },
        {
          metric: 'seatHeight',
          label: 'Seat height',
          display: v.seatHeight != null ? String(v.seatHeight) : null,
          lowerIsBetter: true,
          better: 'lower than',
          worse: 'taller than',
        },
      ]
    : [
        {
          metric: 'cc',
          label: 'Displacement',
          display: v.powerCC ? `${v.powerCC} cc` : null,
          better: 'bigger than',
          worse: 'smaller than',
        },
        {
          metric: 'mileage',
          label: 'Claimed mileage',
          display: v.mileageClaimed ?? null,
          better: 'better mileage than',
          worse: 'worse mileage than',
        },
        {
          metric: 'weight',
          label: 'Kerb weight',
          display: v.weight != null ? String(v.weight) : null,
          lowerIsBetter: true,
          better: 'lighter than',
          worse: 'heavier than',
        },
        {
          metric: 'topSpeed',
          label: 'Top speed',
          display: v.topSpeed ?? null,
          better: 'faster than',
          worse: 'slower than',
        },
      ]

  const usable = tiles.filter((tile) => tile.display !== null)
  if (usable.length === 0) return null

  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {usable.map((tile) => {
        const standing = segmentStanding(entry, all, tile.metric, tile.lowerIsBetter)

        return (
          <li key={tile.metric} className="card p-4">
            <p className="micro text-ink-subtle">{tile.label}</p>
            <p className="figure mt-1.5 text-xl text-ink">{tile.display}</p>
            {standing && (
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                {standing.percent >= 50 ? tile.better : tile.worse}{' '}
                <span className="tnum font-semibold text-ink">
                  {standing.percent >= 50 ? standing.percent : 100 - standing.percent}%
                </span>{' '}
                of {standing.segment}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

interface SpecFact {
  label: string
  detail?: string
}

/**
 * Fitted / not fitted, read straight off the spec columns.
 *
 * The portals run a "Pros and cons" block here, written by an editor who rode
 * the bike. We have no editors and no test rides, so writing one would be
 * fiction. What the catalog *does* support is the factual half of that block:
 * which equipment is on the sheet and which is absent, stated as such.
 *
 * The heading says where it comes from, and every line is traceable to a
 * column. That is a smaller claim than "pros and cons" and it is one this site
 * can actually stand behind.
 */
export function SpecHighlights({ entry }: { entry: IndexedVehicle }) {
  const v = entry.vehicle
  const fitted: SpecFact[] = []
  const missing: SpecFact[] = []

  if (entry.abs) {
    fitted.push({ label: 'Anti-lock brakes', detail: v.brakingType ?? undefined })
  } else if (v.brakingType) {
    missing.push({ label: 'No ABS', detail: `Listed with ${v.brakingType}` })
  }

  if (entry.frontDisc) {
    fitted.push({ label: 'Front disc brake', detail: v.frontBrake ?? undefined })
  } else if (v.frontBrake) {
    missing.push({ label: 'Drum front brake', detail: v.frontBrake })
  }

  if (v.rearBrake && /disc/i.test(v.rearBrake)) {
    fitted.push({ label: 'Rear disc brake', detail: v.rearBrake })
  }

  // tyreType is typed `string | number | null` because the column is free
  // text and a few rows hold a bare size, so it is stringified before display.
  const tyre = v.tyreType != null ? String(v.tyreType).trim() : ''
  if (entry.tubeless) {
    fitted.push({ label: 'Tubeless tyres', detail: tyre || undefined })
  } else if (tyre) {
    missing.push({ label: 'Tube-type tyres', detail: tyre })
  }

  if (entry.bluetooth) {
    fitted.push({ label: 'Bluetooth console' })
  } else if (v.bluetooth === false) {
    missing.push({ label: 'No Bluetooth console' })
  }

  if (v.chargingPort === true) fitted.push({ label: 'USB charging port' })
  if (v.bootLight === true) fitted.push({ label: 'Boot light' })

  if (v.startType && /self/i.test(v.startType)) {
    fitted.push({ label: 'Self start', detail: v.startType })
  }

  if (v.ridingModes) fitted.push({ label: 'Riding modes', detail: v.ridingModes })

  if (entry.ev) {
    if (v.fastCharging === true) {
      fitted.push({ label: 'Fast charging', detail: v.chargingTimeFast ?? undefined })
    } else if (v.fastCharging === false) {
      missing.push({ label: 'No fast charging' })
    }
    if (v.regenerativeBraking === true) fitted.push({ label: 'Regenerative braking' })
    if (v.batteryWarranty) {
      fitted.push({ label: 'Battery warranty', detail: v.batteryWarranty })
    }
  }

  if (v.freeServiceCount) {
    fitted.push({
      label: `${v.freeServiceCount} free services`,
      detail: v.firstServiceKM ? `First at ${v.firstServiceKM}` : undefined,
    })
  }

  if (fitted.length === 0 && missing.length === 0) return null

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <FactColumn
        title="On the spec sheet"
        tone="positive"
        facts={fitted}
        empty="No equipment is listed for this model yet."
      />
      <FactColumn
        title="Not listed"
        tone="neutral"
        facts={missing}
        empty="Nothing notable is missing from the sheet."
      />
    </div>
  )
}

function FactColumn({
  title,
  tone,
  facts,
  empty,
}: {
  title: string
  tone: 'positive' | 'neutral'
  facts: SpecFact[]
  empty: string
}) {
  return (
    <section className="card p-5">
      <h3 className="micro text-ink-subtle">{title}</h3>

      {facts.length === 0 ? (
        <p className="mt-3 text-sm text-ink-subtle">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {facts.map((fact) => (
            <li key={fact.label} className="flex gap-2.5 text-sm">
              <span
                aria-hidden
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                  tone === 'positive' ? 'bg-ev/12 text-ev' : 'bg-surface-alt text-ink-subtle'
                }`}
              >
                <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tone === 'positive' ? 'm2.5 6.2 2.4 2.4 4.6-5' : 'M3 6h6'} />
                </svg>
              </span>
              <span>
                <span className="font-semibold text-ink">{fact.label}</span>
                {fact.detail && (
                  <span className="text-ink-muted"> · {fact.detail}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
