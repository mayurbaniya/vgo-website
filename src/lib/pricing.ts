/**
 * Loan and on-road pricing maths.
 *
 * Both calculators on this site are pure arithmetic over numbers the visitor
 * supplies plus the ex-showroom price the catalog already carries. Nothing here
 * calls a backend, and nothing here is a quote.
 *
 * That distinction is load-bearing. BikeWale and BikeDekho show an on-road
 * price because they have dealer feeds behind it. We do not, so every figure
 * this module produces is an ESTIMATE built from published slabs, and every
 * surface that renders one has to say so. Presenting a computed number as a
 * dealer price would be the one thing on this site that is actually dishonest
 * rather than merely thin.
 */

// ---------------------------------------------------------------------------
// EMI
// ---------------------------------------------------------------------------

export interface LoanTerms {
  /** Amount financed, after the down payment. */
  principal: number
  /** Annual interest rate, as a percentage — 9.5 means 9.5% p.a. */
  annualRate: number
  months: number
}

export interface LoanBreakdown {
  monthly: number
  totalPayable: number
  totalInterest: number
  /** Interest as a share of the amount borrowed, for the doughnut split. */
  interestShare: number
}

/**
 * Standard reducing-balance EMI.
 *
 *   EMI = P · r · (1+r)^n / ((1+r)^n − 1)
 *
 * The zero-rate case is split out because that formula divides by zero when
 * r = 0, and a 0% scheme is a real thing manufacturers run.
 */
export function calculateLoan({
  principal,
  annualRate,
  months,
}: LoanTerms): LoanBreakdown {
  const safePrincipal = Math.max(0, principal)
  const safeMonths = Math.max(1, Math.round(months))

  if (safePrincipal === 0) {
    return { monthly: 0, totalPayable: 0, totalInterest: 0, interestShare: 0 }
  }

  const monthlyRate = annualRate / 12 / 100

  const monthly =
    monthlyRate === 0
      ? safePrincipal / safeMonths
      : (safePrincipal * monthlyRate * (1 + monthlyRate) ** safeMonths) /
        ((1 + monthlyRate) ** safeMonths - 1)

  const totalPayable = monthly * safeMonths
  const totalInterest = totalPayable - safePrincipal

  return {
    monthly: Math.round(monthly),
    totalPayable: Math.round(totalPayable),
    totalInterest: Math.round(totalInterest),
    interestShare: totalPayable > 0 ? totalInterest / totalPayable : 0,
  }
}

export const LOAN_DEFAULTS = {
  /** Two-wheeler loans are commonly written at 80% of ex-showroom. */
  downPaymentShare: 0.2,
  annualRate: 9.7,
  months: 36,
  rateRange: [7, 20] as const,
  tenureOptions: [12, 24, 36, 48, 60] as const,
}

// ---------------------------------------------------------------------------
// On-road price
// ---------------------------------------------------------------------------

/** Road-tax rates for one state, as a share of ex-showroom price. */
export interface TaxSlab {
  state: string
  petrol: number
  /**
   * Most states waived two-wheeler road tax on EVs under their 2021-22 EV
   * policies; where a state charges, it is entered here rather than assumed
   * to be zero.
   */
  electric: number
}

/**
 * Road tax by city.
 *
 * This is a rate table, NOT a list of cities the product serves — that list
 * comes from the backend (`getCities`), because it is a fact about the business
 * and not about tax law. The two were the same array once and that was the bug:
 * the estimator offered twelve cities when the database held one, so it
 * advertised coverage that did not exist.
 *
 * Road tax on a two-wheeler is a state subject charged as a slab on ex-showroom
 * price, so these are per-state figures filed under the city people search for.
 * They are the published slabs at the time of writing and they do move — update
 * this when a state revises its Motor Vehicles Taxation rules.
 *
 * A city the backend returns that is missing here is handled, not guessed: see
 * `slabForCity`.
 */
const TAX_SLABS: Record<string, TaxSlab> = {
  nagpur: { state: 'Maharashtra', petrol: 0.11, electric: 0 },
  mumbai: { state: 'Maharashtra', petrol: 0.11, electric: 0 },
  pune: { state: 'Maharashtra', petrol: 0.11, electric: 0 },
  nashik: { state: 'Maharashtra', petrol: 0.11, electric: 0 },
  delhi: { state: 'Delhi', petrol: 0.05, electric: 0 },
  bengaluru: { state: 'Karnataka', petrol: 0.14, electric: 0 },
  bangalore: { state: 'Karnataka', petrol: 0.14, electric: 0 },
  hyderabad: { state: 'Telangana', petrol: 0.12, electric: 0 },
  chennai: { state: 'Tamil Nadu', petrol: 0.1, electric: 0 },
  kolkata: { state: 'West Bengal', petrol: 0.06, electric: 0 },
  ahmedabad: { state: 'Gujarat', petrol: 0.06, electric: 0 },
  surat: { state: 'Gujarat', petrol: 0.06, electric: 0 },
  jaipur: { state: 'Rajasthan', petrol: 0.08, electric: 0 },
  lucknow: { state: 'Uttar Pradesh', petrol: 0.08, electric: 0 },
  indore: { state: 'Madhya Pradesh', petrol: 0.08, electric: 0 },
  bhopal: { state: 'Madhya Pradesh', petrol: 0.08, electric: 0 },
}

/**
 * The slab for a city name as the database spells it.
 *
 * City names arrive shouted ("NAGPUR") and unnormalised, so the lookup is
 * case- and space-insensitive. Returns null for a city with no slab on file,
 * which the UI reports rather than papering over with a national average — an
 * invented tax rate is worse than an absent one, because it looks like an
 * answer.
 */
export function slabForCity(name: string): TaxSlab | null {
  const key = name.trim().toLowerCase().replace(/\s+/g, '')
  return TAX_SLABS[key] ?? null
}

/** "NAGPUR" -> "Nagpur". The column is not normalised; the interface should be. */
export function cityLabel(name: string): string {
  return name
    .trim()
    .toLowerCase()
    // Word boundary, so "NEW DELHI" becomes "New Delhi" rather than
    // "NEWDELHI" or "New delhi".
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

/**
 * Five-year third-party premiums, which IRDAI sets by engine capacity and which
 * a new two-wheeler must be sold with. Slab bounds are cc; the last entry is
 * open-ended.
 */
const TP_PREMIUM_BY_CC: { upto: number | null; premium: number }[] = [
  { upto: 75, premium: 2_901 },
  { upto: 150, premium: 3_851 },
  { upto: 350, premium: 7_365 },
  { upto: null, premium: 15_117 },
]

/** The same slabs for electric two-wheelers, set on motor output in kW. */
const TP_PREMIUM_BY_KW: { upto: number | null; premium: number }[] = [
  { upto: 3, premium: 1_780 },
  { upto: 7, premium: 2_904 },
  { upto: 16, premium: 3_371 },
  { upto: null, premium: 9_044 },
]

/** Own-damage cover, as a share of ex-showroom. A working average, not a quote. */
const OWN_DAMAGE_SHARE = 0.015

/** Registration, number plate and dealer handling, roughly flat across cities. */
const REGISTRATION_AND_HANDLING = 1_800

export interface OnRoadLine {
  label: string
  amount: number
  /** Shown under the label so each figure says where it comes from. */
  note?: string
}

export interface OnRoadEstimate {
  exShowroom: number
  lines: OnRoadLine[]
  total: number
}

export interface OnRoadInput {
  exShowroom: number
  slab: TaxSlab
  electric: boolean
  /** Displacement in cc, for the third-party slab. Ignored when electric. */
  cc?: number | null
  /** Motor output in kW, for the electric third-party slab. */
  kw?: number | null
}

function slabPremium(
  slabs: { upto: number | null; premium: number }[],
  value: number | null | undefined,
): number {
  if (value == null) return slabs[1].premium
  return (
    slabs.find((slab) => slab.upto === null || value <= slab.upto)?.premium ??
    slabs[slabs.length - 1].premium
  )
}

/**
 * An itemised on-road estimate.
 *
 * Itemised rather than a single number on purpose: a shopper who can see that
 * ₹21,000 of the difference is state road tax understands why the figure moves
 * between cities, and can tell at a glance that this is arithmetic rather than
 * a price someone quoted.
 */
export function estimateOnRoad({
  exShowroom,
  slab,
  electric,
  cc,
  kw,
}: OnRoadInput): OnRoadEstimate {
  const share = electric ? slab.electric : slab.petrol
  const roadTax = Math.round(exShowroom * share)

  const thirdParty = electric
    ? slabPremium(TP_PREMIUM_BY_KW, kw)
    : slabPremium(TP_PREMIUM_BY_CC, cc)
  const ownDamage = Math.round(exShowroom * OWN_DAMAGE_SHARE)

  const lines: OnRoadLine[] = [
    {
      label: 'RTO / road tax',
      amount: roadTax,
      note:
        share === 0
          ? `${slab.state} waives road tax on electric two-wheelers`
          : `${(share * 100).toFixed(0)}% of ex-showroom in ${slab.state}`,
    },
    {
      label: 'Insurance',
      amount: thirdParty + ownDamage,
      note: '5-year third-party cover plus own damage',
    },
    {
      label: 'Registration & handling',
      amount: REGISTRATION_AND_HANDLING,
      note: 'Number plate, smart card and dealer charges',
    },
  ]

  const total =
    exShowroom + lines.reduce((sum, line) => sum + line.amount, 0)

  return { exShowroom, lines, total }
}

/**
 * Motor output in kW, for the electric third-party insurance slab.
 *
 * `motorPower` is free text and arrives as "8.5 kW", "6000 W" or a bare number.
 * Watts are converted; a bare number is read as kW, which is how the field is
 * filled in practice. Returns null rather than guessing when it cannot tell,
 * and `estimateOnRoad` then falls back to a middle slab.
 */
export function motorKilowatts(raw?: string | null): number | null {
  const text = raw?.trim()
  if (!text) return null

  const match = /^([\d.,]+)/.exec(text)
  if (!match) return null

  const value = Number.parseFloat(match[1].replace(/,/g, ''))
  if (!Number.isFinite(value) || value <= 0) return null

  // Read the unit off the tail rather than pattern-matching the whole string:
  // "5000w" carries no word boundary before the w, so a \bw\b test silently
  // took it as 5000 kW and threw the vehicle into the top insurance slab.
  const unit = text.slice(match[1].length).trim().toLowerCase()
  if (unit.startsWith('kw')) return value
  if (unit.startsWith('w')) return value / 1000

  // Bare number: read as kW, which is how the field is filled in practice.
  return value
}
