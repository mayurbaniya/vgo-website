import type { Vehicle } from '@/lib/types'
import { isElectric } from '@/lib/format'
import { bodyTypeLabel } from '@/lib/site'

type Row = { label: string; value: unknown }

/** Drops rows whose value is null, undefined, empty or a placeholder dash. */
function usable(rows: Row[]): { label: string; value: string }[] {
  return rows.flatMap(({ label, value }) => {
    if (value === null || value === undefined) return []
    if (typeof value === 'boolean') return [{ label, value: value ? 'Yes' : 'No' }]
    const text = String(value).trim()
    if (!text || text === '-' || text === '0') return []
    return [{ label, value: text }]
  })
}

/**
 * One spec group.
 *
 * `<details open>` rather than a plain heading: the full sheet runs to sixty
 * rows across eight groups, and a reader who came for the engine should not
 * have to scroll past the tyres to leave. Open by default so the page still
 * reads as a complete spec sheet — and so the values are in the document for a
 * crawler either way.
 */
function Group({ title, rows }: { title: string; rows: Row[] }) {
  const cleaned = usable(rows)
  if (cleaned.length === 0) return null

  return (
    <details open className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-hairline bg-surface-alt px-5 py-3">
        <span className="display-sm text-sm text-ink">{title}</span>
        <span className="flex items-center gap-2">
          <span className="micro tnum text-ink-subtle">{cleaned.length}</span>
          <span
            aria-hidden
            className="text-ink-subtle transition-transform duration-200 group-open:rotate-180"
          >
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
            </svg>
          </span>
        </span>
      </summary>

      <dl className="divide-y divide-hairline">
        {cleaned.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_1.2fr] gap-4 px-5 py-2.5 text-sm odd:bg-surface even:bg-surface-alt/40"
          >
            <dt className="text-ink-subtle">{row.label}</dt>
            <dd className="font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

/**
 * Renders whichever spec groups have data.
 *
 * The catalog is sparsely populated — most vehicles fill in a handful of the
 * ~60 spec columns — so every group self-hides when empty. A table of "—"
 * placeholders reads as broken and gives crawlers nothing.
 */
export function SpecTable({ vehicle: v }: { vehicle: Vehicle }) {
  const ev = isElectric(v)

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      {ev ? (
        <Group
          title="Battery & motor"
          rows={[
            { label: 'Certified range', value: v.certifiedRange },
            { label: 'Battery capacity', value: v.batteryCapacity },
            { label: 'Battery type', value: v.batteryType },
            { label: 'Motor power', value: v.motorPower },
            { label: 'Motor type', value: v.motorType },
            { label: 'Charging time (standard)', value: v.chargingTimeStandard },
            { label: 'Charging time (fast)', value: v.chargingTimeFast },
            { label: 'Fast charging', value: v.fastCharging },
            { label: 'Battery warranty', value: v.batteryWarranty },
            { label: 'Regenerative braking', value: v.regenerativeBraking },
            { label: 'Riding modes', value: v.ridingModes },
          ]}
        />
      ) : (
        <Group
          title="Engine & transmission"
          rows={[
            { label: 'Displacement', value: v.powerCC ? `${v.powerCC} cc` : null },
            { label: 'Engine type', value: v.engineType },
            { label: 'Stroke', value: v.stroke },
            { label: 'Max torque', value: v.maxTorque },
            { label: 'Cylinders', value: v.cylinderCount },
            { label: 'Gears', value: v.gearCount },
            { label: 'Start type', value: v.startType },
            { label: 'Fuel type', value: v.fuelType },
            { label: 'Fuel capacity', value: v.fuelCapacity },
            { label: 'Reserve fuel', value: v.reserveFuelCapacity },
            { label: 'Claimed mileage', value: v.mileageClaimed },
            { label: 'User-reported mileage', value: v.mileageUser },
            { label: 'Idle start-stop (i3S)', value: v.i3sTechnology },
          ]}
        />
      )}

      <Group
        title="Performance"
        rows={[
          { label: 'Top speed', value: v.topSpeed },
          { label: 'Acceleration', value: v.accelerationTime },
          { label: 'Riding modes', value: ev ? null : v.ridingModes },
        ]}
      />

      <Group
        title="Brakes, wheels & tyres"
        rows={[
          { label: 'Braking type', value: v.brakingType },
          { label: 'Front brake', value: v.frontBrake },
          { label: 'Rear brake', value: v.rearBrake },
          { label: 'Wheel type', value: v.wheelsType },
          { label: 'Front wheel size', value: v.frontWheelSize },
          { label: 'Rear wheel size', value: v.rearWheelSize },
          { label: 'Tyre type', value: v.tyreType },
        ]}
      />

      <Group
        title="Dimensions & chassis"
        rows={[
          { label: 'Kerb weight', value: v.weight },
          { label: 'Seat height', value: v.seatHeight },
          { label: 'Overall height', value: v.overallHeight },
          { label: 'Chassis type', value: v.chassisType },
          { label: 'Seat type', value: v.seatType },
        ]}
      />

      <Group
        title="Features"
        rows={[
          { label: 'Key type', value: v.keyType },
          { label: 'Bluetooth console', value: v.bluetooth },
          { label: 'Boot light', value: v.bootLight },
          { label: 'Charging port', value: v.chargingPort },
        ]}
      />

      <Group
        title="Service & warranty"
        rows={[
          { label: 'Free services', value: v.freeServiceCount },
          { label: 'First service', value: joinService(v.firstServiceKM, v.firstServiceDays) },
          { label: 'Second service', value: joinService(v.secondServiceKM, v.secondServiceDays) },
          { label: 'Battery warranty', value: ev ? v.batteryWarranty : null },
        ]}
      />

      <Group
        title="General"
        rows={[
          { label: 'Manufacturing year', value: v.manufacturingYear },
          { label: 'Launch date', value: v.launchDate },
          { label: 'Variant', value: v.variant },
          { label: 'Colour', value: v.color },
          { label: 'Body type', value: bodyTypeLabel(v.vehicleType) ?? v.vehicleType },
        ]}
      />
    </div>
  )
}

/** "500 km or 30 days" — the schedule is whichever comes first, so say both. */
function joinService(km?: string, days?: string): string | null {
  const parts = [km, days].map((part) => part?.trim()).filter(Boolean)
  if (parts.length === 0) return null
  return parts.join(' or ')
}
