import Image from 'next/image'
import Link from 'next/link'
import type { Vehicle } from '@/lib/types'
import {
  displayPrice,
  isElectric,
  modelLabel,
  primaryImage,
  specCells,
  vehicleHref,
  vehicleTitle,
} from '@/lib/format'
import { bodyTypeLabel } from '@/lib/site'

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const title = vehicleTitle(vehicle)
  const model = modelLabel(vehicle)
  const brand = vehicle.brand?.name?.trim()
  const type = bodyTypeLabel(vehicle.vehicleType)
  const image = primaryImage(vehicle)
  const price = displayPrice(vehicle)
  const cells = specCells(vehicle)
  const ev = isElectric(vehicle)

  return (
    <Link
      href={vehicleHref(vehicle)}
      className="group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_18px_40px_-24px_rgb(20_22_31_/_0.45)]"
    >
      <div className="plate relative aspect-4/3 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            // Three columns on desktop, two on tablet, one on phone — telling
            // the browser this avoids it downloading full-width images for a
            // card that renders at a third of the viewport.
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="micro flex h-full items-center justify-center text-ink-subtle">
            Photo coming soon
          </div>
        )}

        {ev && (
          <span className="micro absolute left-3 top-3 rounded-chip bg-ev px-2 py-1 text-white">
            Electric
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="micro text-ink-subtle">
          {[brand, type].filter(Boolean).join(' · ') || 'Two-wheeler'}
        </p>

        <h3 className="clamp-2 display-sm mt-1.5 text-[1.0625rem] leading-snug text-ink transition-colors group-hover:text-brand-700">
          {model}
        </h3>

        {price ? (
          <p className="display-sm tnum mt-2 text-lg text-ink">{price}</p>
        ) : (
          <p className="mt-2 text-sm text-ink-subtle">Price on request</p>
        )}

        {cells.length > 0 && (
          <div className="cluster mt-auto -mx-4 -mb-4 border-t border-hairline bg-surface-alt/60 pt-3 pb-3">
            {cells.map((c) => (
              <div key={c.label} className="px-4">
                <div className="display-sm tnum text-sm text-ink">{c.value}</div>
                <div className="micro mt-0.5 text-ink-subtle">{c.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
