import type { Vehicle } from './types'

/** Lowercase, hyphenated, ASCII-safe. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    // NFKD splits accented letters into base + combining mark; the
    // non-alphanumeric sweep below then drops the marks. "Ampère" -> "ampere".
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Vehicle URL slug.
 *
 * The API has no slug column, and model names are not guaranteed unique across
 * brands (or even within one — variants share a name). So the id is appended
 * and is what we actually resolve on; the words in front exist for humans and
 * for search engines. Same approach Stack Overflow and GitHub issues use.
 *
 *   Hero + Splendor Plus + 42  ->  "hero-splendor-plus-42"
 */
export function vehicleSlug(v: Vehicle): string {
  const words = [v.brand?.name, v.model].filter(Boolean).join(' ')
  const base = words ? slugify(words) : 'vehicle'
  return `${base}-${v.id}`
}

export function vehicleHref(v: Vehicle): string {
  return `/vehicles/${vehicleSlug(v)}`
}

/**
 * Pulls the trailing id back out of a slug. Returns null when the slug has no
 * numeric tail, which the page turns into a 404 rather than a 500.
 */
export function idFromSlug(slug: string): number | null {
  const match = /-(\d+)$/.exec(slug)
  if (!match) return null
  const id = Number.parseInt(match[1], 10)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function brandSlug(name: string, id: number): string {
  return `${slugify(name)}-${id}`
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** ₹1,20,000 — Indian digit grouping, no paise. */
export function formatInr(value: number): string {
  return INR.format(value)
}

/**
 * `priceRange` is a free-text admin field, so it arrives in inconsistent
 * shapes: "120000", "120000-140000", or already-formatted "₹1.2 Lakh". Digits
 * are reformatted as INR; anything else is passed through untouched rather
 * than mangled.
 */
export function formatPriceRange(raw?: string | null): string | null {
  if (!raw) return null
  const text = raw.trim()
  if (!text) return null

  const parts = text.split(/\s*[-–—]\s*/)
  const numbers = parts.map((p) => {
    const digits = p.replace(/[^\d]/g, '')
    return digits ? Number.parseInt(digits, 10) : NaN
  })

  if (numbers.every((n) => Number.isFinite(n) && n > 0)) {
    if (numbers.length === 1) return formatInr(numbers[0])
    if (numbers.length === 2) {
      if (numbers[0] === numbers[1]) return formatInr(numbers[0])
      return `${formatInr(numbers[0])} – ${formatInr(numbers[1])}`
    }
  }
  return text
}

/**
 * The `isElectric` column is not normalised: live data contains 'Y', 'N',
 * 'true' AND 'false'. Checking only for 'Y' silently mislabels every row that
 * was written as 'true'. Body type 'ELECTRIC' is accepted as a third signal.
 */
/**
 * Display price for a vehicle.
 *
 * `priceRange` is preferred over `price` because `price` is demonstrably
 * unreliable — the Dominar 400 carries price "40000" against a priceRange of
 * "240000 - 245000". `price` is only used when the range is blank.
 */
export function displayPrice(v: Vehicle): string | null {
  return formatPriceRange(v.priceRange) ?? formatPriceRange(v.price)
}

/**
 * The numeric bounds behind a vehicle's price fields, low first.
 *
 * Stripping non-digits from a whole range would concatenate the bounds —
 * "240000 - 245000" becomes "240000245000" — so the range is split on its dash
 * first and each side parsed on its own. Live data also carries Indian digit
 * grouping ("3,11,000 - 3,20,000"), which the non-digit sweep handles.
 *
 * This is the one place prices are parsed. schemaPrice, compactPrice and the
 * catalog index all read through it, so a badly shaped admin entry fails the
 * same way everywhere instead of three different ways.
 */
export function priceBounds(v: Vehicle): [number, number] | null {
  const source = v.priceRange?.trim() || v.price?.trim()
  if (!source) return null

  const numbers = source
    .split(/\s*[-–—]\s*/)
    .map((part) => Number.parseInt(part.replace(/[^\d]/g, ''), 10))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (numbers.length === 0) return null
  return [Math.min(...numbers), Math.max(...numbers)]
}

/**
 * Lowest number in the price fields, as a plain integer string for schema.org.
 * Publishing a concatenated range into structured data is exactly the sort of
 * thing that gets rich results penalised, so this takes the minimum bound.
 */
export function schemaPrice(v: Vehicle): string | null {
  const bounds = priceBounds(v)
  return bounds ? String(bounds[0]) : null
}

export function isElectric(v: Vehicle): boolean {
  const flag = v.isElectric?.trim().toUpperCase()
  if (flag === 'Y' || flag === 'TRUE' || flag === '1') return true
  if (flag === 'N' || flag === 'FALSE' || flag === '0') return false
  return v.vehicleType?.trim().toUpperCase() === 'ELECTRIC'
}

/**
 * Both codes mean scooter: MOFET is the legacy value the backend still filters
 * on in `/user/vehicle/all-mofet`, while newer rows are typed 'SCOOTER'.
 */
export function isScooter(v: Vehicle): boolean {
  const type = v.vehicleType?.trim().toUpperCase()
  return type === 'MOFET' || type === 'SCOOTER'
}

/**
 * Display name, brand-prefixed — but only when the model doesn't already carry
 * the brand. Admins enter `model` inconsistently: "FZ-X" in some rows,
 * "Yamaha FZ-X" in others. Blind concatenation produces "Yamaha Yamaha FZ-X",
 * which reads as broken and duplicates the keyword in the <h1> and <title>.
 *
 * This cannot fix rows where the brand relation itself is wrong (a model named
 * "Bajaj Dominar 400" linked to brand Hero) — that's a data problem, not a
 * formatting one.
 */
export function vehicleTitle(v: Vehicle): string {
  const brand = v.brand?.name?.trim()
  const model = v.model?.trim()

  if (!model) return brand || 'Vehicle'
  if (!brand) return model

  const alreadyPrefixed = model.toLowerCase().startsWith(`${brand.toLowerCase()} `)
  return alreadyPrefixed ? model : `${brand} ${model}`
}

export function primaryImage(v: Vehicle): string | null {
  return v.images?.find((src) => typeof src === 'string' && src.length > 0) ?? null
}

/** "110 cc" / "2.9 kWh" style chips, skipping empty values. */
export function specChips(v: Vehicle): { label: string; value: string }[] {
  const chips: { label: string; value: string }[] = []
  if (isElectric(v)) {
    if (v.certifiedRange) chips.push({ label: 'Range', value: v.certifiedRange })
    if (v.batteryCapacity) chips.push({ label: 'Battery', value: v.batteryCapacity })
    if (v.motorPower) chips.push({ label: 'Motor', value: v.motorPower })
  } else {
    if (v.powerCC) chips.push({ label: 'Engine', value: `${v.powerCC} cc` })
    if (v.mileageClaimed) chips.push({ label: 'Mileage', value: v.mileageClaimed })
    if (v.maxTorque) chips.push({ label: 'Torque', value: v.maxTorque })
  }
  if (v.topSpeed) chips.push({ label: 'Top speed', value: v.topSpeed })
  return chips
}

/**
 * The model on its own, with a leading brand name removed.
 *
 * Cards show the brand as an eyebrow above the model, so repeating it in the
 * title ("Yamaha" / "Yamaha FZ-X") reads as a mistake. `vehicleTitle` still
 * returns the full brand + model string for <h1>, <title> and image alt text,
 * where the brand has to be present.
 */
export function modelLabel(v: Vehicle): string {
  const brand = v.brand?.name?.trim()
  const model = v.model?.trim()
  if (!model) return brand || 'Vehicle'
  if (!brand) return model
  const prefix = `${brand.toLowerCase()} `
  return model.toLowerCase().startsWith(prefix) ? model.slice(prefix.length) : model
}

/**
 * Up to two letters standing in for a missing brand logo.
 *
 * Most brands in the catalog have no uploaded logo, and a tile that renders
 * only a name next to tiles that render a logo makes the grid look broken. A
 * monogram gives every tile the same silhouette.
 */
export function brandMonogram(name?: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Compact price for tight spaces: ₹3.20 L / ₹1.69 Cr, the shorthand every
 * Indian price listing uses. Falls back to the full range string when the
 * field isn't numeric.
 */
export function compactPrice(v: Vehicle): string | null {
  const bounds = priceBounds(v)
  if (!bounds) return displayPrice(v)
  return compactInr(bounds[0])
}

/** ₹3.20 L / ₹1.69 Cr from a plain number. */
export function compactInr(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)} L`
  return formatInr(value)
}

export interface SpecCell {
  /** The figure itself, e.g. "398". */
  value: string
  /** Its unit, shown beneath as a micro label, e.g. "CC". */
  label: string
}

/**
 * Splits a spec string into figure and unit so it can be set as an instrument
 * readout — "29 kmpl" becomes 29 over KMPL.
 *
 * Values in this catalog are free text and inconsistent by row: mileage arrives
 * as "29 kmpl", "27 km/l" or a bare "45", top speed as "162 km/h" or "140". The
 * leading number is taken as the figure and the caller supplies the unit, so
 * the readout is uniform even when the source data isn't.
 */
function cell(raw: unknown, label: string): SpecCell | null {
  if (raw === null || raw === undefined) return null
  const text = String(raw).trim()
  if (!text || text === '0') return null
  const match = /^[\d.,]+/.exec(text)
  if (!match) return { value: text, label }
  const value = match[0].replace(/[.,]$/, '')
  return value ? { value, label } : null
}

/**
 * The three figures that decide a shortlist, per fuel type: an EV shopper reads
 * range before anything else, a petrol shopper reads displacement. Both end on
 * top speed so the last column lines up across a mixed grid.
 */
export function specCells(v: Vehicle): SpecCell[] {
  const cells = isElectric(v)
    ? [
        cell(v.certifiedRange, 'KM RANGE'),
        cell(v.batteryCapacity, 'KWH'),
        cell(v.topSpeed, 'KM/H'),
      ]
    : [
        cell(v.powerCC, 'CC'),
        cell(v.mileageClaimed, 'KMPL'),
        cell(v.topSpeed, 'KM/H'),
      ]

  return cells.filter((c): c is SpecCell => c !== null).slice(0, 3)
}
