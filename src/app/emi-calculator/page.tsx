import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCatalogSnapshot } from '@/lib/catalog'
import { ModelPicker, type PickableModel } from '@/components/model-picker'
import { PageHeader } from '@/components/vehicle-listing'
import { motorKilowatts } from '@/lib/pricing'
import { MARKET } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Two-Wheeler EMI Calculator',
  description: `Work out the monthly EMI on any bike or scooter in ${MARKET}. Set the down payment, interest rate and tenure, and see the total interest the loan costs.`,
  alternates: { canonical: '/emi-calculator' },
}

export default function EmiCalculatorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tools"
        title="EMI calculator"
        description="Pick a model, set the down payment and tenure, and see the monthly figure — and what the loan adds in interest."
      />

      <div className="shell py-8">
        <Suspense fallback={<div className="shimmer h-96 rounded-card" />}>
          <Calculator />
        </Suspense>

        <section className="mt-12 max-w-3xl">
          <h2 className="display-sm text-base text-ink">How the figure is worked out</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            The calculator uses the standard reducing-balance formula every
            lender applies: interest is charged on the outstanding balance, which
            falls each month as you repay, so an early instalment is mostly
            interest and a late one is mostly principal. The monthly figure
            itself does not change.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Two things it cannot know. Your rate depends on the lender and your
            credit history — the 9.7% it starts at is a working figure for a
            two-wheeler loan, not an offer. And most dealers finance the on-road
            price rather than ex-showroom, so if you are borrowing against the
            full amount, run the{' '}
            <Link href="/on-road-price" className="font-semibold text-brand-700 hover:underline">
              on-road estimate
            </Link>{' '}
            first and put that number into the price slider.
          </p>
        </section>
      </div>
    </>
  )
}

async function Calculator() {
  const snapshot = await getCatalogSnapshot()

  const models: PickableModel[] = snapshot.vehicles
    .filter((entry) => entry.priceMin !== null)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      price: entry.priceMin!,
      ev: entry.ev,
      cc: entry.cc,
      kw: motorKilowatts(entry.vehicle.motorPower),
    }))

  if (models.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-hairline p-10 text-center text-sm text-ink-subtle">
        The catalog is unavailable right now, so there is nothing to calculate
        against. Try again shortly.
      </p>
    )
  }

  return <ModelPicker models={models} tool="emi" />
}
