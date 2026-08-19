import type { Vehicle } from '@/lib/types'
import { isElectric } from '@/lib/format'

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

function Group({ title, rows }: { title: string; rows: Row[] }) {
  const cleaned = usable(rows)
  if (cleaned.length === 0) return null

  return (
    <section className="rounded-xl border border-hairline">
      <h3 className="border-b border-hairline bg-surface-alt px-5 py-3 font-semibold text-ink">
        {title}
      </h3>
      <dl className="divide-y divide-hairline">
        {cleaned.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-2 gap-4 px-5 py-3 text-sm"
          >
            <dt className="text-ink-subtle">{row.label}</dt>
            <dd className="font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
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
    <div className="grid gap-5 md:grid-cols-2">
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
            { label: 'Max torque', value: v.maxTorque },
            { label: 'Cylinders', value: v.cylinderCount },
            { label: 'Gears', value: v.gearCount },
            { label: 'Start type', value: v.startType },
            { label: 'Fuel type', value: v.fuelType },
            { label: 'Fuel capacity', value: v.fuelCapacity },
            { label: 'Claimed mileage', value: v.mileageClaimed },
            { label: 'User-reported mileage', value: v.mileageUser },
          ]}
        />
      )}

      <Group
        title="Performance"
        rows={[
          { label: 'Top speed', value: v.topSpeed },
          { label: 'Acceleration', value: v.accelerationTime },
        ]}
      />

      <Group
        title="Brakes, wheels & suspension"
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
          { label: 'Bluetooth', value: v.bluetooth },
          { label: 'Boot light', value: v.bootLight },
          { label: 'Charging port', value: v.chargingPort },
          { label: 'Free services', value: v.freeServiceCount },
        ]}
      />

      <Group
        title="General"
        rows={[
          { label: 'Manufacturing year', value: v.manufacturingYear },
          { label: 'Launch date', value: v.launchDate },
          { label: 'Variant', value: v.variant },
          { label: 'Colour', value: v.color },
          { label: 'Body type', value: v.vehicleType },
        ]}
      />
    </div>
  )
}
