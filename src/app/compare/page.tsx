import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCatalogSnapshot, type IndexedVehicle } from '@/lib/catalog'
import { COMPARE_MAX, compareHref, parseCompareIds } from '@/lib/compare'
import { displayPrice, formatInr } from '@/lib/format'
import { PageHeader } from '@/components/vehicle-listing'
import { EmptyState } from '@/components/vehicle-grid'
import { MARKET } from '@/lib/site'

export const metadata: Metadata = {
  title: `Compare Bikes & Scooters in ${MARKET}`,
  description: `Put up to ${COMPARE_MAX} two-wheelers side by side and compare price, engine, mileage, brakes, dimensions and features line by line.`,
  alternates: { canonical: '/compare' },
}

export default function ComparePage(props: PageProps<'/compare'>) {
  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="Compare two-wheelers"
        description={`Up to ${COMPARE_MAX} models side by side, every specification lined up, with the differences marked.`}
      />
      <div className="shell py-8">
        <Suspense fallback={<div className="shimmer h-96 rounded-card" />}>
          <Comparison searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  )
}

async function Comparison({
  searchParams,
}: Pick<PageProps<'/compare'>, 'searchParams'>) {
  const [params, snapshot] = await Promise.all([searchParams, getCatalogSnapshot()])

  const ids = parseCompareIds(params.v)
  const diffOnly = params.diff === '1'

  const columns = ids
    .map((id) => snapshot.vehicles.find((entry) => entry.id === id))
    .filter((entry): entry is IndexedVehicle => entry !== undefined)

  if (columns.length < 2) {
    return (
      <div className="space-y-8">
        <EmptyState
          message={
            columns.length === 0
              ? 'Pick two models to compare. Tick "Compare" on any card in the catalog, or start from the list below.'
              : 'One model selected. Add at least one more to compare.'
          }
        />
        <Picker
          all={snapshot.vehicles}
          selected={columns}
          diffOnly={diffOnly}
        />
      </div>
    )
  }

  const groups = buildGroups(columns, diffOnly)
  const rowCount = groups.reduce((sum, group) => sum + group.rows.length, 0)

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{columns.length}</span> models ·{' '}
          <span className="tnum">{rowCount}</span>{' '}
          {diffOnly ? 'differing specifications' : 'specifications'}
        </p>

        {/* A link, not a toggle: the view is part of the URL, so a shared
            comparison arrives showing what the sender was looking at. */}
        <Link
          href={`${compareHref(columns.map((entry) => entry.id))}${diffOnly ? '' : '&diff=1'}`}
          scroll={false}
          className={`btn-ghost ${diffOnly ? 'border-ink/25 bg-surface-alt text-ink' : ''}`}
        >
          {diffOnly ? 'Show all specifications' : 'Show differences only'}
        </Link>
      </div>

      {/*
        One scroll container for the whole table so the header row and the body
        move together. Four columns plus the label column overflow a laptop
        screen, and shrinking the type to avoid that would defeat the point.
      */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse">
          <thead>
            <tr>
              {/* Sticky so the model you are reading about stays identified
                  however far down the sheet you scroll. */}
              <th className="under-header sticky z-10 w-40 bg-surface p-0" />
              {columns.map((entry) => (
                <th
                  key={entry.id}
                  scope="col"
                  className="under-header sticky z-10 border-b border-hairline bg-surface p-3 align-bottom"
                >
                  <ColumnHead entry={entry} columns={columns} diffOnly={diffOnly} />
                </th>
              ))}
            </tr>
          </thead>

          {groups.map((group) => (
            <tbody key={group.title}>
              <tr>
                <th
                  colSpan={columns.length + 1}
                  scope="colgroup"
                  className="border-y border-hairline bg-surface-alt px-3 py-2 text-left"
                >
                  <span className="micro text-ink">{group.title}</span>
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.label} className="border-b border-hairline">
                  <th
                    scope="row"
                    className="bg-surface px-3 py-3 text-left align-top text-xs font-medium text-ink-subtle"
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td
                      key={columns[i].id}
                      className={`px-3 py-3 align-top text-sm ${
                        cell.best ? 'font-semibold text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {cell.value ?? <span className="text-ink-subtle">—</span>}
                      {cell.best && (
                        <span className="micro ml-2 rounded-chip bg-ev/10 px-1.5 py-0.5 text-ev">
                          Best
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {groups.length === 0 && (
        <EmptyState message="These models have identical values for every specification the catalog holds." />
      )}

      {columns.length < COMPARE_MAX && (
        <Picker all={snapshot.vehicles} selected={columns} diffOnly={diffOnly} />
      )}
    </div>
  )
}

function ColumnHead({
  entry,
  columns,
  diffOnly,
}: {
  entry: IndexedVehicle
  columns: IndexedVehicle[]
  diffOnly: boolean
}) {
  const image = entry.vehicle.images?.find(Boolean) ?? null
  const remaining = columns
    .filter((column) => column.id !== entry.id)
    .map((column) => column.id)

  return (
    <div className="w-44">
      <div className="plate relative aspect-4/3 overflow-hidden rounded-[8px]">
        {image && (
          <Image src={image} alt={entry.title} fill sizes="176px" className="object-contain p-2" />
        )}
      </div>

      <Link
        href={entry.href}
        className="display-sm clamp-2 mt-2 block text-left text-sm leading-snug text-ink hover:text-brand-700"
      >
        {entry.title}
      </Link>

      <p className="figure mt-1 text-left text-sm text-ink-muted">
        {entry.priceMin !== null ? formatInr(entry.priceMin) : '—'}
      </p>

      <Link
        href={`${compareHref(remaining)}${diffOnly && remaining.length >= 2 ? '&diff=1' : ''}`}
        scroll={false}
        className="mt-1.5 inline-block text-xs font-medium text-ink-subtle hover:text-danger"
      >
        Remove
      </Link>
    </div>
  )
}

/**
 * Add another model.
 *
 * Sorted so the closest rivals to what is already selected come first — after
 * picking a Classic 350 the next thing anyone wants is the bikes it competes
 * with, not the alphabetically first scooter.
 */
function Picker({
  all,
  selected,
  diffOnly,
}: {
  all: IndexedVehicle[]
  selected: IndexedVehicle[]
  diffOnly: boolean
}) {
  const chosen = new Set(selected.map((entry) => entry.id))
  const anchor = selected[0]

  const options = all
    .filter((entry) => !chosen.has(entry.id))
    .sort((a, b) => {
      if (!anchor) return (b.brandRating ?? 0) - (a.brandRating ?? 0)
      const sameBody = (entry: IndexedVehicle) =>
        entry.bodySlug === anchor.bodySlug ? 0 : 1
      return (
        sameBody(a) - sameBody(b) ||
        Math.abs((a.priceMin ?? 0) - (anchor.priceMin ?? 0)) -
          Math.abs((b.priceMin ?? 0) - (anchor.priceMin ?? 0))
      )
    })
    .slice(0, 12)

  if (options.length === 0) return null

  return (
    <section>
      <h2 className="display-sm mb-4 text-base text-ink">
        {selected.length === 0 ? 'Start with a model' : 'Add another model'}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {options.map((entry) => {
          const next = [...selected.map((row) => row.id), entry.id]
          return (
            <li key={entry.id}>
              <Link
                href={`${compareHref(next)}${diffOnly && next.length >= 2 ? '&diff=1' : ''}`}
                scroll={false}
                className="card card-interactive flex h-full flex-col p-3"
              >
                <span className="plate relative aspect-4/3 overflow-hidden rounded-[6px]">
                  {entry.vehicle.images?.find(Boolean) && (
                    <Image
                      src={entry.vehicle.images.find(Boolean)!}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-contain p-1.5"
                    />
                  )}
                </span>
                <span className="clamp-2 mt-2 text-xs font-semibold leading-snug text-ink">
                  {entry.title}
                </span>
                <span className="figure mt-1 text-xs text-ink-subtle">
                  {entry.priceMin !== null ? formatInr(entry.priceMin) : '—'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

interface Cell {
  value: string | null
  best: boolean
}

interface CompareRow {
  label: string
  cells: Cell[]
}

interface CompareGroup {
  title: string
  rows: CompareRow[]
}

/**
 * One comparable specification.
 *
 * `rank` is what makes the table more than two spec sheets printed next to each
 * other: where a figure has an unambiguous better direction — more mileage,
 * less weight, a lower price — the winning cell is marked. Rows with no
 * meaningful direction ("Engine type", "Colour") supply no rank and are simply
 * listed, because declaring a winner there would be an opinion the data does
 * not support.
 */
interface RowSpec {
  label: string
  read: (entry: IndexedVehicle) => string | null
  rank?: { of: (entry: IndexedVehicle) => number | null; better: 'higher' | 'lower' }
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  const trimmed = String(value).trim()
  return trimmed && trimmed !== '-' && trimmed !== '0' ? trimmed : null
}

function buildGroups(columns: IndexedVehicle[], diffOnly: boolean): CompareGroup[] {
  // A comparison of only electrics has no use for fuel capacity, and one of
  // only petrol bikes has none for charging time. Mixed sets show both, because
  // "this one has a battery and that one does not" is the comparison.
  const anyEv = columns.some((entry) => entry.ev)
  const anyPetrol = columns.some((entry) => !entry.ev)

  const specs: { title: string; rows: RowSpec[] }[] = [
    {
      title: 'Price',
      rows: [
        {
          label: 'Ex-showroom',
          read: (entry) => displayPrice(entry.vehicle),
          rank: { of: (entry) => entry.priceMin, better: 'lower' },
        },
      ],
    },
    ...(anyPetrol
      ? [
          {
            title: 'Engine & transmission',
            rows: [
              {
                label: 'Displacement',
                read: (entry: IndexedVehicle) =>
                  entry.cc ? `${entry.cc} cc` : null,
                rank: { of: (entry: IndexedVehicle) => entry.cc, better: 'higher' as const },
              },
              { label: 'Engine type', read: (entry: IndexedVehicle) => text(entry.vehicle.engineType) },
              { label: 'Max torque', read: (entry: IndexedVehicle) => text(entry.vehicle.maxTorque) },
              { label: 'Gears', read: (entry: IndexedVehicle) => text(entry.vehicle.gearCount) },
              { label: 'Start type', read: (entry: IndexedVehicle) => text(entry.vehicle.startType) },
              { label: 'Fuel capacity', read: (entry: IndexedVehicle) => text(entry.vehicle.fuelCapacity) },
              {
                label: 'Claimed mileage',
                read: (entry: IndexedVehicle) => text(entry.vehicle.mileageClaimed),
                rank: { of: (entry: IndexedVehicle) => entry.mileage, better: 'higher' as const },
              },
            ],
          },
        ]
      : []),
    ...(anyEv
      ? [
          {
            title: 'Battery & motor',
            rows: [
              {
                label: 'Certified range',
                read: (entry: IndexedVehicle) => text(entry.vehicle.certifiedRange),
                rank: { of: (entry: IndexedVehicle) => entry.rangeKm, better: 'higher' as const },
              },
              { label: 'Battery capacity', read: (entry: IndexedVehicle) => text(entry.vehicle.batteryCapacity) },
              { label: 'Motor power', read: (entry: IndexedVehicle) => text(entry.vehicle.motorPower) },
              { label: 'Charging (standard)', read: (entry: IndexedVehicle) => text(entry.vehicle.chargingTimeStandard) },
              { label: 'Charging (fast)', read: (entry: IndexedVehicle) => text(entry.vehicle.chargingTimeFast) },
              { label: 'Regenerative braking', read: (entry: IndexedVehicle) => text(entry.vehicle.regenerativeBraking) },
              { label: 'Battery warranty', read: (entry: IndexedVehicle) => text(entry.vehicle.batteryWarranty) },
            ],
          },
        ]
      : []),
    {
      title: 'Performance',
      rows: [
        {
          label: 'Top speed',
          read: (entry) => text(entry.vehicle.topSpeed),
          rank: { of: (entry) => entry.topSpeed, better: 'higher' },
        },
        { label: 'Acceleration', read: (entry) => text(entry.vehicle.accelerationTime) },
        { label: 'Riding modes', read: (entry) => text(entry.vehicle.ridingModes) },
      ],
    },
    {
      title: 'Brakes & tyres',
      rows: [
        { label: 'Braking type', read: (entry) => text(entry.vehicle.brakingType) },
        { label: 'Front brake', read: (entry) => text(entry.vehicle.frontBrake) },
        { label: 'Rear brake', read: (entry) => text(entry.vehicle.rearBrake) },
        { label: 'Wheel type', read: (entry) => text(entry.vehicle.wheelsType) },
        { label: 'Tyre type', read: (entry) => text(entry.vehicle.tyreType) },
      ],
    },
    {
      title: 'Dimensions',
      rows: [
        {
          label: 'Kerb weight',
          read: (entry) => text(entry.vehicle.weight),
          rank: { of: (entry) => entry.weight, better: 'lower' },
        },
        { label: 'Seat height', read: (entry) => text(entry.vehicle.seatHeight) },
        { label: 'Chassis', read: (entry) => text(entry.vehicle.chassisType) },
      ],
    },
    {
      title: 'Features',
      rows: [
        { label: 'Bluetooth console', read: (entry) => text(entry.vehicle.bluetooth) },
        { label: 'Key type', read: (entry) => text(entry.vehicle.keyType) },
        { label: 'USB charging port', read: (entry) => text(entry.vehicle.chargingPort) },
        { label: 'Boot light', read: (entry) => text(entry.vehicle.bootLight) },
        {
          label: 'Free services',
          read: (entry) => text(entry.vehicle.freeServiceCount),
          rank: { of: (entry) => entry.vehicle.freeServiceCount ?? null, better: 'higher' },
        },
      ],
    },
  ]

  return specs
    .map((group) => ({
      title: group.title,
      rows: group.rows
        .map((spec) => buildRow(spec, columns))
        .filter((row): row is CompareRow => row !== null)
        .filter((row) => !diffOnly || differs(row)),
    }))
    .filter((group) => group.rows.length > 0)
}

function buildRow(spec: RowSpec, columns: IndexedVehicle[]): CompareRow | null {
  const values = columns.map(spec.read)
  // A row where nobody has a value is noise on every comparison it appears in.
  if (values.every((value) => value === null)) return null

  let bestIndexes = new Set<number>()

  if (spec.rank) {
    const numbers = columns.map(spec.rank.of)
    const present = numbers.filter((n): n is number => n !== null)

    // Marking a winner needs at least two contenders, and a tie between all of
    // them is not a win.
    if (present.length >= 2) {
      const target =
        spec.rank.better === 'higher' ? Math.max(...present) : Math.min(...present)
      if (present.some((n) => n !== target)) {
        bestIndexes = new Set(
          numbers.flatMap((n, i) => (n === target ? [i] : [])),
        )
      }
    }
  }

  return {
    label: spec.label,
    cells: values.map((value, i) => ({
      value,
      best: value !== null && bestIndexes.has(i),
    })),
  }
}

function differs(row: CompareRow): boolean {
  const values = row.cells.map((cell) => cell.value ?? '')
  return values.some((value) => value !== values[0])
}
