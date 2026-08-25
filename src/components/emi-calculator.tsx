'use client'

import { useMemo, useState } from 'react'
import { formatInr } from '@/lib/format'
import { LOAN_DEFAULTS, calculateLoan } from '@/lib/pricing'

/**
 * The EMI calculator.
 *
 * "What is it a month" is the question that actually decides a two-wheeler
 * purchase, and it is arithmetic — no backend, no dealer feed, no account. The
 * three inputs are the three a lender varies; everything else is derived.
 *
 * The split bar under the figure is the part that earns its place: someone
 * stretching to 60 months to get the monthly number down can see, immediately,
 * that they have added most of a year's EMI in interest to do it.
 */
export function EmiCalculator({
  price,
  compact = false,
}: {
  /** Ex-showroom price to start from. Editable — the loan is often on-road. */
  price: number
  /** Tighter layout for the vehicle page, where it sits inside a section. */
  compact?: boolean
}) {
  const [amount, setAmount] = useState(price)
  const [downPayment, setDownPayment] = useState(
    Math.round(price * LOAN_DEFAULTS.downPaymentShare),
  )
  const [rate, setRate] = useState(LOAN_DEFAULTS.annualRate)
  const [months, setMonths] = useState<number>(LOAN_DEFAULTS.months)

  const principal = Math.max(0, amount - downPayment)
  const loan = useMemo(
    () => calculateLoan({ principal, annualRate: rate, months }),
    [principal, rate, months],
  )

  return (
    <div className={compact ? '' : 'card p-6 sm:p-8'}>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Slider
            label="Vehicle price"
            value={amount}
            min={20_000}
            max={1_000_000}
            step={1_000}
            format={formatInr}
            onChange={(next) => {
              setAmount(next)
              // Keeping the down payment above the price would produce a
              // negative loan; clamp it rather than letting the figure go odd.
              setDownPayment((current) => Math.min(current, next))
            }}
          />

          <Slider
            label="Down payment"
            value={downPayment}
            min={0}
            max={amount}
            step={1_000}
            format={formatInr}
            note={`${Math.round((downPayment / Math.max(amount, 1)) * 100)}% of price · borrowing ${formatInr(principal)}`}
            onChange={setDownPayment}
          />

          <Slider
            label="Interest rate"
            value={rate}
            min={LOAN_DEFAULTS.rateRange[0]}
            max={LOAN_DEFAULTS.rateRange[1]}
            step={0.1}
            format={(value) => `${value.toFixed(1)}% p.a.`}
            onChange={setRate}
          />

          <div>
            <p className="micro mb-2 text-ink-subtle">Tenure</p>
            <div className="seg flex-wrap">
              {LOAN_DEFAULTS.tenureOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  data-active={months === option}
                  onClick={() => setMonths(option)}
                  className="seg-item tnum"
                >
                  {option / 12} yr
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card border border-hairline bg-surface-alt/60 p-5">
          <p className="micro text-ink-subtle">Monthly EMI</p>
          <p className="figure mt-1 text-4xl text-ink">{formatInr(loan.monthly)}</p>
          <p className="mt-1 text-xs text-ink-subtle">
            for {months} months at {rate.toFixed(1)}%
          </p>

          {/* Principal against interest, to scale. */}
          <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-hairline">
            <span
              className="bg-brand-600"
              style={{ width: `${(1 - loan.interestShare) * 100}%` }}
            />
            <span
              className="bg-signal"
              style={{ width: `${loan.interestShare * 100}%` }}
            />
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Amount borrowed" value={formatInr(principal)} swatch="bg-brand-600" />
            <Row
              label="Total interest"
              value={formatInr(loan.totalInterest)}
              swatch="bg-signal"
            />
            <Row label="Total payable" value={formatInr(loan.totalPayable)} strong />
          </dl>

          <p className="mt-5 text-xs leading-relaxed text-ink-subtle">
            An estimate on a reducing-balance loan. Your actual rate depends on
            the lender, your credit history and any processing fee.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  swatch,
  strong = false,
}: {
  label: string
  value: string
  swatch?: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        strong ? 'border-t border-hairline pt-3' : ''
      }`}
    >
      <dt className="flex items-center gap-2 text-ink-muted">
        {swatch && <span className={`size-2 rounded-full ${swatch}`} />}
        {label}
      </dt>
      <dd className={`tnum ${strong ? 'figure text-base text-ink' : 'font-semibold text-ink'}`}>
        {value}
      </dd>
    </div>
  )
}

/**
 * A range input with its value shown as a figure above it.
 *
 * A number field would be more precise and much worse: nobody types 147,000 to
 * see what it does to the monthly number, they drag until the monthly number
 * looks right. The figure above keeps the exact value visible while they do.
 */
function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  note,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  note?: string
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="micro text-ink-subtle" htmlFor={`emi-${label}`}>
          {label}
        </label>
        <span className="figure text-base text-ink">{format(value)}</span>
      </div>
      <input
        id={`emi-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-brand-600"
      />
      {note && <p className="mt-1 text-xs text-ink-subtle">{note}</p>}
    </div>
  )
}
