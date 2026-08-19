import Link from 'next/link'
import { Suspense } from 'react'
import {
  getCatalogCounts,
  getFeaturedVehicles,
  getNewlyLaunched,
  getPopularBrands,
} from '@/lib/api'
import {
  GridSkeleton,
  SectionHeading,
  VehicleGrid,
} from '@/components/vehicle-grid'
import { BrandStrip } from '@/components/brand-strip'
import { SearchBox } from '@/components/search-box'
import type { CatalogCounts } from '@/lib/api'
import {
  BODY_TYPES,
  PLAY_STORE_URL,
  PRIMARY_CITY,
  PRIMARY_CITY_RTO,
} from '@/lib/site'

export default function HomePage() {
  return (
    <>
      <Hero />
      <BodyTypes />

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
        {/*
          Each rail is its own cached component and streams independently, so a
          slow or failing endpoint degrades only its own section instead of
          holding up the whole page.
        */}
        <Suspense fallback={<RailSkeleton title="Featured" />}>
          <FeaturedRail />
        </Suspense>

        <Suspense fallback={<RailSkeleton title="Newly launched" />}>
          <NewlyLaunchedRail />
        </Suspense>

        <Suspense fallback={<RailSkeleton title="Brands" />}>
          <BrandsRail />
        </Suspense>
      </div>

      <AppBand />
    </>
  )
}

function Hero() {
  const shortcuts = [
    { href: '/bikes', label: 'Bikes' },
    { href: '/scooters', label: 'Scooters' },
    { href: '/electric', label: 'Electric' },
    { href: '/type/sports', label: 'Sports' },
    { href: '/type/cruiser', label: 'Cruiser' },
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

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
        <div>
          <span className="plate-chip inline-flex items-center gap-2 rounded-[4px] px-2.5 py-1 text-[0.6875rem]">
            {PRIMARY_CITY_RTO}
            <span className="text-black/35">·</span>
            {PRIMARY_CITY.toUpperCase()}
          </span>

          <h1 className="display mt-6 text-[2.75rem] text-ground-ink sm:text-6xl">
            Find your next bike
            <br />
            or scooter in {PRIMARY_CITY}
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ground-muted">
            On-road prices, full specifications and claimed mileage for every
            two-wheeler sold in the city — petrol and electric.
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBox size="hero" />
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

        <Suspense fallback={<StatsPanel />}>
          <LiveStatsPanel />
        </Suspense>
      </div>
    </section>
  )
}

/**
 * The catalog readout — the hero's supporting figure, set the way a console
 * displays one: label under value, cells split by hairlines. The same frame
 * renders with em dashes while the counts stream in, so the hero never
 * reflows when they land.
 */
function StatsPanel({ counts }: { counts?: CatalogCounts | null }) {
  const cells = [
    { label: 'Models listed', value: counts?.vehicles },
    { label: 'Brands', value: counts?.brands },
    { label: 'Electric', value: counts?.electric },
  ]

  return (
    <div className="plate-dark rounded-card border border-white/10 p-6">
      <p className="micro text-white/40">Catalog · {PRIMARY_CITY}</p>
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
        Specifications come from the manufacturer. Prices are indicative and
        move with dealer offers.
      </p>
    </div>
  )
}

async function LiveStatsPanel() {
  const counts = await getCatalogCounts()
  return <StatsPanel counts={counts} />
}

function BodyTypes() {
  const tiles = [
    ...BODY_TYPES.map((type) => ({
      href: `/type/${type.slug}`,
      label: type.label,
      blurb: type.blurb,
    })),
    { href: '/scooters', label: 'Scooter', blurb: 'City-smart commute' },
    { href: '/electric', label: 'Electric', blurb: 'Zero fuel bills' },
    { href: '/bikes', label: 'All bikes', blurb: 'The full catalog' },
  ]

  return (
    <section className="border-b border-hairline bg-surface-alt/60">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          eyebrow="Start here"
          title="Browse by body type"
          description="The shape of the bike is the first thing most people decide on."
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="group flex h-full flex-col justify-between rounded-card border border-hairline bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_14px_30px_-22px_rgb(20_22_31_/_0.5)]"
              >
                <span className="display-sm text-base text-ink">
                  {tile.label}
                </span>
                <span className="mt-6 flex items-end justify-between gap-2">
                  <span className="text-xs text-ink-subtle">{tile.blurb}</span>
                  <span
                    aria-hidden
                    className="text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-signal"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

async function FeaturedRail() {
  const vehicles = await getFeaturedVehicles()
  if (vehicles.length === 0) return null

  return (
    <section>
      <SectionHeading
        eyebrow="This week"
        title="Featured"
        description="Picked by our team from what is moving in showrooms right now."
      />
      <VehicleGrid vehicles={vehicles.slice(0, 6)} />
    </section>
  )
}

async function NewlyLaunchedRail() {
  const vehicles = await getNewlyLaunched(6)
  if (vehicles.length === 0) return null

  return (
    <section>
      <SectionHeading
        eyebrow="Just landed"
        title="Newly launched"
        description="The most recent arrivals in the catalog."
        action={
          <Link
            href="/bikes"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            See all models →
          </Link>
        }
      />
      <VehicleGrid vehicles={vehicles} />
    </section>
  )
}

async function BrandsRail() {
  const brands = await getPopularBrands()
  if (brands.length === 0) return null

  return (
    <section>
      <SectionHeading
        title="Popular brands"
        action={
          <Link
            href="/brands"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            All brands →
          </Link>
        }
      />
      <BrandStrip brands={brands} />
    </section>
  )
}

function AppBand() {
  return (
    <section className="bg-ground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="display text-2xl text-ground-ink sm:text-3xl">
            Shortlist it, then talk to a dealer
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ground-muted">
            Save models to your favourites, get told when a price changes and
            connect with a showroom — all in the VGO app.
          </p>
        </div>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 self-start rounded-control bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-500 sm:self-auto"
        >
          Get the app
        </a>
      </div>
    </section>
  )
}

function RailSkeleton({ title }: { title: string }) {
  return (
    <section>
      <SectionHeading title={title} />
      <GridSkeleton count={3} />
    </section>
  )
}
