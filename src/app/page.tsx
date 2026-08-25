import Link from 'next/link'
import { Suspense } from 'react'
import {
  getActiveOffers,
  getCatalogCounts,
  getFeaturedVehicles,
  getNews,
  getNewlyLaunched,
} from '@/lib/api'
import {
  getCatalogSnapshot,
  indexVehicles,
  isNewlyLaunched,
  popularComparisons,
} from '@/lib/catalog'
import { sortVehicles } from '@/lib/filters'
import {
  GridSkeleton,
  RailSkeleton,
  SectionHeading,
  SectionLink,
  VehicleRail,
} from '@/components/vehicle-grid'
import { BrowseBy } from '@/components/browse-by'
import { ComparisonStrip } from '@/components/comparison-strip'
import { HeroSearch } from '@/components/hero-search'
import { NewsCard } from '@/components/news-card'
import { OfferCard } from '@/components/offer-card'
import { ComingSoonBand, ReviewsPanel } from '@/components/placeholders'
import { Tabs } from '@/components/tabs'
import type { CatalogCounts } from '@/lib/api'
import { GetAppButton } from '@/components/get-app-button'
import { MARKET, MARKET_PLATE, SITE_NAME } from '@/lib/site'

/**
 * The home page.
 *
 * Ordered the way the question actually narrows: what am I looking for (hero) →
 * what is worth looking at (spotlight) → how do I cut the catalog down (browse
 * by) → what will it cost me (tools) → this one or that one (comparisons) →
 * what is on right now (offers, EV, news). That is the sequence every
 * two-wheeler portal converged on, and it is not decoration: each module
 * answers the question the one above it leaves you with.
 *
 * Every catalog-backed section sits behind its own Suspense boundary and
 * streams independently, so one slow or failing endpoint degrades its own strip
 * rather than holding up the page. The underlying fetches are cached and shared
 * (see lib/api.ts), so the several `getCatalogSnapshot()` calls below cost one
 * round trip between them.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Hero />}>
        <LiveHero />
      </Suspense>

      <section className="shell py-14">
        <SectionHeading
          eyebrow="Start here"
          title="Bikes in the spotlight"
          description="What our team is featuring, what is selling, and what has only just landed."
        />
        <Suspense fallback={<RailSkeleton />}>
          <SpotlightTabs />
        </Suspense>
      </section>

      <section className="shell py-14">
        <SectionHeading
          title="Browse the catalog by"
          description="Every way the catalog can be cut, with the number of models behind each one."
        />
        <Suspense fallback={<GridSkeleton count={6} />}>
          <BrowseSection />
        </Suspense>
      </section>

      <ToolsBand />

      <section className="shell py-14">
        <SectionHeading
          eyebrow="This or that"
          title="Popular comparisons"
          description="Closely matched models people cross-shop, paired by segment and price."
          action={<SectionLink href="/compare">Build your own</SectionLink>}
        />
        <Suspense fallback={<RailSkeleton count={3} />}>
          <Comparisons />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <OffersSection />
      </Suspense>

      <Suspense fallback={null}>
        <ElectricBand />
      </Suspense>

      <Suspense fallback={null}>
        <NewsSection />
      </Suspense>

      <section className="shell space-y-5 pb-14">
        <ReviewsPanel />
        <ComingSoonBand
          eyebrow="Not here yet"
          title="Used bikes and showrooms"
          body={`Both need data VGO does not hold: a used inventory and a dealer network. Until they exist we would rather show you nothing than a page of placeholders. New-bike prices, specs and offers are live today.`}
          action={{ href: '/bikes', label: 'Browse new bikes' }}
        />
      </section>

      <AppBand />
    </>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({
  counts,
  brands = [],
}: {
  counts?: CatalogCounts | null
  brands?: { id: number; name: string }[]
}) {
  const shortcuts = [
    { href: '/bikes', label: 'Bikes' },
    { href: '/scooters', label: 'Scooters' },
    { href: '/electric', label: 'Electric' },
    { href: '/type/sports', label: 'Sports' },
    { href: '/type/cruiser', label: 'Cruiser' },
    { href: '/bikes?budget=under-80k', label: 'Under ₹80k' },
  ]

  return (
    <section className="relative overflow-hidden bg-ground">
      {/*
        Ambient light behind the readout panel. Static, not animated — the page
        has enough to look at without something moving in the background.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-24 size-[34rem] rounded-full bg-brand-600/20 blur-3xl"
      />

      <div className="shell relative grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
        <div>
          <span className="plate-chip inline-flex items-center gap-2 rounded-[4px] px-2.5 py-1 text-[0.6875rem]">
            {MARKET_PLATE}
          </span>

          <h1 className="display mt-6 text-[2.75rem] text-ground-ink sm:text-6xl">
            Find your next bike
            <br />
            or scooter in {MARKET}
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ground-muted">
            Ex-showroom prices, full specifications and claimed mileage for every
            two-wheeler sold in {MARKET} — petrol and electric.
          </p>

          <div className="mt-8 max-w-2xl">
            <HeroSearch brands={brands} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="micro mr-1 text-white/35">Popular</span>
            {shortcuts.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-chip border border-white/12 px-3 py-1.5 text-sm text-ground-muted transition-colors hover:border-white/30 hover:text-ground-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <StatsPanel counts={counts} />
      </div>
    </section>
  )
}

async function LiveHero() {
  const [counts, snapshot] = await Promise.all([
    getCatalogCounts(),
    getCatalogSnapshot(),
  ])

  const brands = snapshot.brands
    .filter((brand) => brand.id != null && brand.name)
    .map((brand) => ({ id: brand.id!, name: brand.name! }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return <Hero counts={counts} brands={brands} />
}

/**
 * The catalog readout — the hero's supporting figure, set the way a console
 * displays one: label under value, cells split by hairlines. The same frame
 * renders with em dashes while the counts stream in, so the hero never reflows
 * when they land.
 */
function StatsPanel({ counts }: { counts?: CatalogCounts | null }) {
  const cells = [
    { label: 'Models listed', value: counts?.vehicles },
    { label: 'Brands', value: counts?.brands },
    { label: 'Electric', value: counts?.electric },
  ]

  return (
    <div className="plate-dark rounded-card border border-white/10 p-6">
      <p className="micro text-white/40">Catalog · {MARKET}</p>
      <div className="cluster cluster-dark mt-5">
        {cells.map((cell) => (
          <div key={cell.label} className="px-3 first:pl-0">
            <div className="display tnum text-3xl text-ground-ink sm:text-4xl">
              {cell.value ?? '—'}
            </div>
            <div className="micro mt-2 text-white/40">{cell.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-white/35">
        Specifications come from the manufacturer. Prices are indicative and move
        with dealer offers.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Spotlight
// ---------------------------------------------------------------------------

/**
 * Four takes on the same catalog.
 *
 * Two of the tabs come from endpoints the backend curates (featured, newly
 * launched) and two are derived here. All four panels render into the document
 * — see the note in components/tabs.tsx — so this section links to most of the
 * catalog from the home page without showing a wall of cards.
 */
async function SpotlightTabs() {
  const [featured, launched, snapshot] = await Promise.all([
    getFeaturedVehicles(),
    getNewlyLaunched(8),
    getCatalogSnapshot(),
  ])

  const popular = sortVehicles(snapshot.vehicles, 'popular').slice(0, 8)
  const electric = sortVehicles(
    snapshot.vehicles.filter((entry) => entry.ev),
    'popular',
  ).slice(0, 8)

  const tabs = [
    { key: 'featured', label: 'Featured', rows: indexVehicles(featured).slice(0, 8) },
    { key: 'popular', label: 'Popular', rows: popular },
    { key: 'electric', label: 'Electric', rows: electric },
    { key: 'new', label: 'Newly launched', rows: indexVehicles(launched) },
  ].filter((tab) => tab.rows.length > 0)

  if (tabs.length === 0) return null

  return (
    <Tabs
      ariaLabel="Spotlight"
      tabs={tabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        badge: tab.rows.length,
        panel: <VehicleRail vehicles={tab.rows} today={snapshot.today} />,
      }))}
    />
  )
}

async function BrowseSection() {
  const snapshot = await getCatalogSnapshot()
  if (snapshot.vehicles.length === 0) return null
  return <BrowseBy snapshot={snapshot} />
}

async function Comparisons() {
  const snapshot = await getCatalogSnapshot()
  return <ComparisonStrip pairs={popularComparisons(snapshot.vehicles, 6)} />
}

// ---------------------------------------------------------------------------
// Bands
// ---------------------------------------------------------------------------

/**
 * The tools band.
 *
 * Price and finance are where two-wheeler shopping actually stalls — "what does
 * it cost me on the road" and "what is that a month". Both calculators run on
 * arithmetic and the ex-showroom price we already have, so the site can answer
 * them without a dealer feed. The band states plainly that they are estimates;
 * see the header of lib/pricing.ts for why that line is not optional.
 */
function ToolsBand() {
  const tools = [
    {
      href: '/on-road-price',
      title: 'On-road price',
      body: 'Add state road tax, insurance and registration to any model, itemised, for twelve cities.',
      icon: <TagIcon />,
    },
    {
      href: '/emi-calculator',
      title: 'EMI calculator',
      body: 'Down payment, tenure and rate against the monthly figure and what the loan costs in total.',
      icon: <CalculatorIcon />,
    },
    {
      href: '/compare',
      title: 'Compare models',
      body: 'Up to four side by side, with every specification lined up and the differences marked.',
      icon: <CompareIcon />,
    },
  ]

  return (
    <section className="border-y border-hairline bg-surface-alt">
      <div className="shell py-14">
        <SectionHeading
          eyebrow="Tools"
          title="Work out what it actually costs"
          description="Estimates built from published tax slabs and standard loan maths — not dealer quotes."
        />

        <ul className="grid gap-4 sm:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="card card-interactive group flex h-full flex-col p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand-700">
                  {tool.icon}
                </span>
                <h3 className="display-sm mt-4 text-base text-ink">
                  {tool.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {tool.body}
                </p>
                <span className="micro mt-4 text-ink-subtle transition-colors group-hover:text-signal">
                  Open →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

async function OffersSection() {
  const offers = await getActiveOffers()
  if (offers.length === 0) return null

  return (
    <section className="border-y border-hairline bg-surface-alt">
      <div className="shell py-14">
        <SectionHeading
          eyebrow="Running now"
          title="Offers and discounts"
          description="Live dealer benefits across the catalog."
          action={<SectionLink href="/offers">All offers</SectionLink>}
        />
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {offers.slice(0, 4).map((offer) => (
            <li key={offer.id}>
              <OfferCard offer={offer} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

async function ElectricBand() {
  const snapshot = await getCatalogSnapshot()
  const evs = snapshot.vehicles.filter((entry) => entry.ev)
  if (evs.length === 0) return null

  const fresh = evs.filter((entry) => isNewlyLaunched(entry, snapshot.today)).length
  const bestRange = evs.reduce(
    (best, entry) => (entry.rangeKm && entry.rangeKm > best ? entry.rangeKm : best),
    0,
  )

  return (
    <section className="shell py-14">
      <div className="overflow-hidden rounded-card border border-hairline bg-gradient-to-br from-ev/8 via-surface to-surface">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="micro text-ev">Go electric</p>
            <h2 className="display mt-2 text-2xl text-ink sm:text-3xl">
              {evs.length} electric two-wheeler{evs.length === 1 ? '' : 's'}, no road
              tax in most states
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
              {bestRange > 0
                ? `Certified range up to ${bestRange} km${fresh > 0 ? `, and ${fresh} of them launched in the last few months` : ''}.`
                : 'Certified range, battery capacity and charging times for every EV we track.'}
            </p>
          </div>
          <Link href="/electric" className="btn-primary shrink-0 self-start sm:self-auto">
            See electric models
          </Link>
        </div>
      </div>
    </section>
  )
}

async function NewsSection() {
  const articles = await getNews()
  if (articles.length === 0) return null

  return (
    <section className="shell pb-14">
      <SectionHeading
        eyebrow="Latest"
        title="News and launches"
        action={<SectionLink href="/news">All news</SectionLink>}
      />
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.slice(0, 4).map((article, i) => (
          <li key={article.url ?? i}>
            <NewsCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The closing app pitch.
 *
 * Set inside a card rather than as bare text on the band. Every other block on
 * this page — the reviews panel, the used-bikes notice, the tool tiles, every
 * vehicle card — carries the same internal padding, so text laid straight onto
 * the band was the one thing whose first character sat at the page gutter. It
 * only had to line up with the card directly above it to look wrong, and on a
 * phone the gap was 1rem against 2.5rem.
 *
 * The band stays full-bleed: that is what separates this from the white section
 * above it. It is only the content that moved inside a card, which is the same
 * grey-band-holding-white-cards shape the tools and offers sections use.
 */
function AppBand() {
  return (
    <section className="border-t border-hairline bg-surface-alt">
      <div className="shell py-14">
        <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="display text-2xl text-ink sm:text-3xl">
              Shortlist it, then talk to a dealer
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
              Save models to your favourites, get told when a price changes and
              connect with a showroom — all in the {SITE_NAME} app.
            </p>
          </div>
          <GetAppButton className="self-start sm:self-auto" />
        </div>
      </div>
    </section>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3h6.5L17 10.5 10.5 17 3 9.5z" />
      <circle cx="6.75" cy="6.75" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="2.5" width="12" height="15" rx="2" />
      <path d="M7 6h6M7 10h.01M10 10h.01M13 10h.01M7 13.5h.01M10 13.5h.01M13 13.5h.01" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v14M4 7h3M4 11h3M13 7h3M13 11h3" />
      <rect x="2.5" y="4" width="6" height="12" rx="1.5" />
      <rect x="11.5" y="4" width="6" height="12" rx="1.5" />
    </svg>
  )
}
