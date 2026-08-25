import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  getActiveOffers,
  getCities,
  getVehicleById,
  getVehicleReviewSummary,
  getVehicleReviews,
} from '@/lib/api'
import {
  getCatalogSnapshot,
  indexVehicles,
  isNewlyLaunched,
  similarVehicles,
  type IndexedVehicle,
} from '@/lib/catalog'
import { buildFaq, faqJsonLd } from '@/lib/faq'
import { compareHref } from '@/lib/compare'
import { motorKilowatts } from '@/lib/pricing'
import { CompareButton } from '@/components/compare-button'
import { EmiCalculator } from '@/components/emi-calculator'
import { Gallery } from '@/components/gallery'
import { PlayGlyph } from '@/components/get-app-button'
import { OfferCard } from '@/components/offer-card'
import { OnRoadEstimator } from '@/components/onroad-estimator'
import { VehicleReviews } from '@/components/reviews'
import { SpecTable } from '@/components/spec-table'
import { StickySubnav, type SubnavSection } from '@/components/sticky-subnav'
import { VehicleActionBar } from '@/components/vehicle-action-bar'
import { KeySpecs, SpecHighlights } from '@/components/vehicle-highlights'
import { SectionLink, VehicleRail } from '@/components/vehicle-grid'
import {
  brandSlug,
  displayPrice,
  formatInr,
  idFromSlug,
  isElectric,
  primaryImage,
  schemaPrice,
  vehicleHref,
  vehicleTitle,
} from '@/lib/format'
import { PLAY_STORE_URL, SITE_NAME, SITE_URL } from '@/lib/site'
import type { Offer, Vehicle } from '@/lib/types'

/**
 * Resolves the slug's trailing id. Returns null for a malformed slug or an
 * unknown id so the caller can 404 rather than render an empty page — a soft
 * 404 (200 status, no content) is actively harmful for indexing.
 */
async function load(slugPromise: Promise<{ slug: string }>) {
  const { slug } = await slugPromise
  const id = idFromSlug(slug)
  if (id === null) return null
  return getVehicleById(id)
}

export async function generateMetadata({
  params,
}: PageProps<'/vehicles/[slug]'>): Promise<Metadata> {
  const vehicle = await load(params)
  if (!vehicle) return { title: 'Vehicle not found' }

  const title = vehicleTitle(vehicle)
  const price = displayPrice(vehicle)
  const [entry] = indexVehicles([vehicle])

  const specs = [
    entry?.cc ? `${entry.cc} cc` : null,
    vehicle.mileageClaimed ? `${vehicle.mileageClaimed} mileage` : null,
    vehicle.certifiedRange ? `${vehicle.certifiedRange} range` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const description = [
    `${title} ex-showroom price${price ? ` starts at ${price}` : ''}.`,
    specs ? `${specs}.` : '',
    'Full specifications, on-road price estimate, EMI and rival comparisons.',
  ]
    .filter(Boolean)
    .join(' ')

  const image = primaryImage(vehicle)
  const canonical = vehicleHref(vehicle)

  return {
    title: `${title} Price, Specs & Mileage`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} — Price & Specifications`,
      description,
      url: canonical,
      type: 'website',
      images: image ? [{ url: image, alt: title }] : undefined,
    },
  }
}

/*
 * No generateStaticParams — see the note in /brands/[slug]/page.tsx. Vehicle
 * URLs are served the App Shell on first hit and upgraded via ISR, which keeps
 * deploys independent of backend uptime and means a newly added vehicle is
 * crawlable without a redeploy.
 */

/**
 * Deliberately not async: awaiting `params` here would read runtime data
 * outside a Suspense boundary and cost the route its static shell. The await
 * happens in <VehicleContent> instead.
 */
export default function VehiclePage(props: PageProps<'/vehicles/[slug]'>) {
  return (
    <Suspense fallback={<VehicleSkeleton />}>
      <VehicleContent params={props.params} />
    </Suspense>
  )
}

async function VehicleContent({
  params,
}: Pick<PageProps<'/vehicles/[slug]'>, 'params'>) {
  const vehicle = await load(params)
  if (!vehicle) notFound()

  // The catalog index gives this page two things the single-vehicle endpoint
  // cannot: parsed numbers for the calculators, and the peer set every
  // "compared to its segment" claim on the page is measured against.
  const [snapshot, offers, cities] = await Promise.all([
    getCatalogSnapshot(),
    getActiveOffers(),
    getCities(),
  ])

  const [entry] = indexVehicles([vehicle])
  if (!entry) notFound()

  const [reviewSummary, reviews] = await Promise.all([
    getVehicleReviewSummary(entry.id),
    getVehicleReviews(entry.id, 6),
  ])

  const title = entry.title
  const price = displayPrice(vehicle)
  const images = (vehicle.images ?? []).filter(Boolean)
  const faq = buildFaq(entry)

  const peers = snapshot.vehicles.filter((row) => row.id !== entry.id)
  const similar = similarVehicles(entry, peers, 6)
  const rivals = similar.slice(0, 3)

  const relevantOffers = offers.filter(
    (offer) =>
      offer.vehicleId === entry.id ||
      (offer.vehicleId == null && offer.brandId === entry.brandId),
  )

  // Only sections that actually render get an entry, so the sub-nav can never
  // link to an anchor that is not on the page.
  const sections: SubnavSection[] = [
    { id: 'overview', label: 'Overview' },
    entry.priceMin !== null ? { id: 'price', label: 'On-road price' } : null,
    entry.priceMin !== null ? { id: 'emi', label: 'EMI' } : null,
    { id: 'specs', label: 'Specifications' },
    rivals.length > 0 ? { id: 'compare', label: 'Compare' } : null,
    similar.length > 0 ? { id: 'similar', label: 'Similar' } : null,
    relevantOffers.length > 0 ? { id: 'offers', label: 'Offers' } : null,
    (reviewSummary?.totalReviews ?? 0) > 0
      ? { id: 'reviews', label: 'Reviews' }
      : null,
    faq.length > 0 ? { id: 'faq', label: 'FAQ' } : null,
  ].filter((section): section is SubnavSection => section !== null)

  return (
    <>
      <JsonLd vehicle={vehicle} entry={entry} faq={faq} />

      <div className="shell py-6 lg:py-8">
        <Breadcrumbs vehicle={vehicle} />

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <Gallery images={images} title={title} />
          <Summary entry={entry} price={price} today={snapshot.today} />
        </div>
      </div>

      <StickySubnav sections={sections} />

      <div className="shell space-y-14 py-12">
        <section id="overview" className="anchor">
          <h2 className="display mb-5 text-xl text-ink sm:text-2xl">
            {title} at a glance
          </h2>
          <KeySpecs entry={entry} all={peers} />

          {vehicle.description && (
            <p className="mt-6 max-w-3xl leading-relaxed text-ink-muted">
              {vehicle.description}
            </p>
          )}

          <div className="mt-6">
            <SpecHighlights entry={entry} />
          </div>
        </section>

        {entry.priceMin !== null && (
          <>
            <section id="price" className="anchor">
              <h2 className="display mb-2 text-xl text-ink sm:text-2xl">
                {title} on-road price
              </h2>
              <p className="mb-5 max-w-2xl text-sm text-ink-muted">
                What the ex-showroom figure becomes once state road tax,
                insurance and registration are added.
              </p>
              <OnRoadEstimator
                exShowroom={entry.priceMin}
                electric={entry.ev}
                cc={entry.cc}
                kw={motorKilowatts(vehicle.motorPower)}
                cities={estimatorCities(cities)}
              />
            </section>

            <section id="emi" className="anchor">
              <h2 className="display mb-2 text-xl text-ink sm:text-2xl">
                {title} EMI
              </h2>
              <p className="mb-5 max-w-2xl text-sm text-ink-muted">
                Move the sliders to see what the monthly figure does — and what
                the loan costs you in total.
              </p>
              <EmiCalculator price={entry.priceMin} />
            </section>
          </>
        )}

        <section id="specs" className="anchor">
          <h2 className="display mb-5 text-xl text-ink sm:text-2xl">
            {title} specifications
          </h2>
          <SpecTable vehicle={vehicle} />
        </section>

        {rivals.length > 0 && (
          <section id="compare" className="anchor">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="display text-xl text-ink sm:text-2xl">
                  Compare the {entry.model}
                </h2>
                <p className="mt-1.5 text-sm text-ink-muted">
                  The closest models in the catalog on segment, price and engine.
                </p>
              </div>
              <SectionLink
                href={compareHref([entry.id, ...rivals.map((rival) => rival.id)])}
              >
                Compare all four
              </SectionLink>
            </div>

            <ul className="grid gap-4 sm:grid-cols-3">
              {rivals.map((rival) => (
                <li key={rival.id}>
                  <Link
                    href={compareHref([entry.id, rival.id])}
                    className="card card-interactive group flex h-full flex-col justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="micro text-ink-subtle">
                        {entry.model} vs
                      </p>
                      <p className="display-sm mt-1 text-base text-ink">
                        {rival.title}
                      </p>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="figure text-sm text-ink-muted">
                        {rival.priceMin !== null ? formatInr(rival.priceMin) : '—'}
                      </span>
                      <span className="text-xs font-semibold text-brand-700 transition-colors group-hover:text-brand-500">
                        Compare →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {similar.length > 0 && (
          <section id="similar" className="anchor">
            <h2 className="display mb-5 text-xl text-ink sm:text-2xl">
              Similar {entry.bodyLabel?.toLowerCase() ?? 'models'}
            </h2>
            <VehicleRail vehicles={similar} today={snapshot.today} />
          </section>
        )}

        {relevantOffers.length > 0 && (
          <section id="offers" className="anchor">
            <h2 className="display mb-5 text-xl text-ink sm:text-2xl">
              Offers on the {entry.model}
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relevantOffers.slice(0, 3).map((offer: Offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="reviews" className="anchor">
          <h2 className="display mb-5 text-xl text-ink sm:text-2xl">
            {(reviewSummary?.totalReviews ?? 0) > 0
              ? `${entry.model} owner reviews`
              : 'Owner reviews'}
          </h2>
          <VehicleReviews
            subject={entry.model}
            summary={reviewSummary}
            reviews={reviews}
          />
        </section>

        {faq.length > 0 && (
          <section id="faq" className="anchor">
            <h2 className="display mb-5 text-xl text-ink sm:text-2xl">
              {title} — frequently asked
            </h2>
            <div className="max-w-3xl divide-y divide-hairline border-y border-hairline">
              {faq.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <span className="font-semibold text-ink">{item.question}</span>
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-45"
                    >
                      <svg viewBox="0 0 12 12" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M6 1.5v9M1.5 6h9" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Room for the sticky bar so it never covers the footer's last row. */}
      <div className="h-20 lg:hidden" />
      {price && (
        <VehicleActionBar
          price={price}
          note={`${entry.model} · ex-showroom`}
        />
      )}
    </>
  )
}

/**
 * The summary panel beside the gallery.
 *
 * Ordered the way the decision is made: what it is, what it costs, what it is
 * made of, what to do next. The CTA row is four different next steps rather
 * than one, because at this point on the page people want different things —
 * the on-road figure, the monthly figure, a rival, or the app.
 */
function Summary({
  entry,
  price,
  today,
}: {
  entry: IndexedVehicle
  price: string | null
  today: number
}) {
  const v = entry.vehicle
  const chips = [
    entry.bodyLabel,
    entry.ev ? 'Electric' : v.fuelType,
    v.gearCount ? `${v.gearCount}-speed` : null,
    entry.abs ? 'ABS' : null,
  ].filter((chip): chip is string => Boolean(chip))

  const ranged = entry.priceMax !== null && entry.priceMin !== null && entry.priceMax > entry.priceMin

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {entry.brandName && (
          <Link
            href={`/brands/${brandSlug(entry.brandName, entry.brandId!)}`}
            className="micro text-brand-700 hover:underline"
          >
            {entry.brandName}
          </Link>
        )}
        {isNewlyLaunched(entry, today) && (
          <span className="micro rounded-chip bg-signal px-2 py-1 text-white">
            Newly launched
          </span>
        )}
        {entry.ev && (
          <span className="micro rounded-chip bg-ev px-2 py-1 text-white">
            Electric
          </span>
        )}
      </div>

      <h1 className="display mt-2 text-3xl text-ink sm:text-4xl">{entry.title}</h1>

      {v.variant && <p className="mt-1.5 text-sm text-ink-subtle">{v.variant}</p>}

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip} className="chip">
              {chip}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 rounded-card border border-hairline bg-surface-alt/60 p-5">
        {/*
          Says what the number actually is. `displayPrice` reads
          vehicle.price / priceRange — the ex-showroom figure, identical in
          every city — so labelling it "Price in <city>" would promise a
          city-specific number the catalog does not have. The on-road estimator
          below is where city enters.
        */}
        <p className="micro text-ink-subtle">
          Ex-showroom price{ranged ? ' · range across variants' : ''}
        </p>
        <p className="figure mt-1 text-3xl text-ink">{price ?? 'On request'}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {entry.priceMin !== null && (
            <>
              <a href="#price" className="btn-primary px-4 py-2.5 text-sm">
                Check on-road price
              </a>
              <a href="#emi" className="btn-ghost">
                Calculate EMI
              </a>
            </>
          )}
          <CompareButton id={entry.id} variant="inline" />
        </div>
      </div>

      {v.color && (
        <div className="mt-5">
          <p className="micro text-ink-subtle">Colours listed</p>
          <p className="mt-1.5 text-sm text-ink">{v.color}</p>
        </div>
      )}

      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between gap-4 rounded-card border border-brand-200 bg-brand-50 p-4 transition-colors hover:border-brand-300"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">
            Save it and get price-drop alerts
          </span>
          <span className="mt-0.5 block text-xs text-ink-muted">
            Favourites, alerts and dealer contact live in the {SITE_NAME} app.
          </span>
        </span>
        <PlayGlyph className="size-7 shrink-0" />
      </a>
    </div>
  )
}

/**
 * City rows reduced to what the estimator needs, dropping any that are
 * disabled or missing a name. Status 1 is active — see city.status.* in the
 * backend's application.properties.
 */
function estimatorCities(cities: { id?: number; name?: string; status?: number }[]) {
  return cities
    .filter((city) => city.id != null && city.name && city.status !== 99)
    .map((city) => ({ id: city.id!, name: city.name! }))
}

function VehicleSkeleton() {
  return (
    <div className="shell py-8">
      <div className="shimmer h-4 w-64 rounded" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="shimmer aspect-4/3 rounded-card" />
        <div className="space-y-4">
          <div className="shimmer h-10 w-3/4 rounded" />
          <div className="shimmer h-6 w-40 rounded" />
          <div className="shimmer h-32 rounded-card" />
          <div className="shimmer h-24 rounded-card" />
        </div>
      </div>
    </div>
  )
}

function Breadcrumbs({ vehicle }: { vehicle: Vehicle }) {
  const brand = vehicle.brand

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-subtle">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-brand-700">
            Home
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link
            href={isElectric(vehicle) ? '/electric' : '/bikes'}
            className="hover:text-brand-700"
          >
            {isElectric(vehicle) ? 'Electric' : 'Bikes'}
          </Link>
        </li>
        {brand?.name && brand.id != null && (
          <>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/brands/${brandSlug(brand.name, brand.id)}`}
                className="hover:text-brand-700"
              >
                {brand.name}
              </Link>
            </li>
          </>
        )}
        <li aria-hidden>/</li>
        <li className="text-ink">{vehicle.model}</li>
      </ol>
    </nav>
  )
}

/**
 * Structured data.
 *
 * Product is what earns the price chip in a search result, which is most of the
 * click-through advantage a listing page has over a competitor's. BreadcrumbList
 * replaces the naked URL under the title with a readable trail, and FAQPage can
 * win the expandable answers underneath — built from the same array the page
 * renders, because markup that disagrees with the visible page is a manual
 * action waiting to happen.
 */
function JsonLd({
  vehicle,
  entry,
  faq,
}: {
  vehicle: Vehicle
  entry: IndexedVehicle
  faq: ReturnType<typeof buildFaq>
}) {
  const title = entry.title
  const price = schemaPrice(vehicle)
  const image = primaryImage(vehicle)
  const url = `${SITE_URL}${entry.href}`

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    url,
    ...(image ? { image: [image] } : {}),
    ...(entry.brandName
      ? { brand: { '@type': 'Brand', name: entry.brandName } }
      : {}),
    ...(vehicle.description ? { description: vehicle.description } : {}),
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price,
            availability: 'https://schema.org/InStock',
            url,
          },
        }
      : {}),
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', item: SITE_URL },
      {
        name: entry.ev ? 'Electric' : 'Bikes',
        item: `${SITE_URL}${entry.ev ? '/electric' : '/bikes'}`,
      },
      ...(entry.brandName && entry.brandId != null
        ? [
            {
              name: entry.brandName,
              item: `${SITE_URL}/brands/${brandSlug(entry.brandName, entry.brandId)}`,
            },
          ]
        : []),
      { name: title, item: url },
    ].map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  }

  const blobs = [product, breadcrumbs, ...(faq.length > 0 ? [faqJsonLd(faq)] : [])]

  return (
    <>
      {blobs.map((blob, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Content is built from our own API, not from user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blob) }}
        />
      ))}
    </>
  )
}
