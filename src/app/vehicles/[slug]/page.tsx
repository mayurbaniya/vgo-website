import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getVehicleById } from '@/lib/api'
import { SpecTable } from '@/components/spec-table'
import {
  brandSlug,
  displayPrice,
  idFromSlug,
  isElectric,
  primaryImage,
  schemaPrice,
  specChips,
  vehicleHref,
  vehicleTitle,
} from '@/lib/format'
import { PLAY_STORE_URL, PRIMARY_CITY, SITE_NAME, SITE_URL } from '@/lib/site'
import type { Vehicle } from '@/lib/types'

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
  const chips = specChips(vehicle)
    .map((c) => `${c.label} ${c.value}`)
    .join(', ')

  const description = [
    `${title} price in ${PRIMARY_CITY}${price ? ` starts at ${price}` : ''}.`,
    chips ? `${chips}.` : '',
    'See full specifications, features and dealer offers.',
  ]
    .filter(Boolean)
    .join(' ')

  const image = primaryImage(vehicle)
  const canonical = vehicleHref(vehicle)

  return {
    title: `${title} Price in ${PRIMARY_CITY}, Specs & Mileage`,
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

  const title = vehicleTitle(vehicle)
  const price = displayPrice(vehicle)
  const images = (vehicle.images ?? []).filter(Boolean)
  const chips = specChips(vehicle)

  return (
    <>
      <JsonLd vehicle={vehicle} />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs vehicle={vehicle} />

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <Gallery images={images} title={title} />

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>

            {vehicle.variant && (
              <p className="mt-1 text-ink-subtle">{vehicle.variant}</p>
            )}

            <p className="mt-4 text-sm text-ink-subtle">
              Price in {PRIMARY_CITY}
            </p>
            <p className="text-3xl font-bold text-brand-700">
              {price ?? 'On request'}
            </p>

            {chips.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {chips.map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-lg border border-hairline p-3"
                  >
                    <dt className="text-xs text-ink-subtle">{chip.label}</dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {chip.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {vehicle.description && (
              <p className="mt-6 text-ink-muted">{vehicle.description}</p>
            )}

            {/*
              Favourite / Mark Interest both write to the user's account, so
              they need a login the public site deliberately does not have.
              Rather than showing a button that dead-ends in an auth wall, the
              CTA sends people to the app that already does it.
            */}
            <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-5">
              <h2 className="font-semibold text-ink">
                Interested in this {isElectric(vehicle) ? 'EV' : 'vehicle'}?
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Save it to your favourites, get price-drop alerts and connect
                with a dealer in the {SITE_NAME} app.
              </p>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Get the app
              </a>
            </div>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-ink">
            {title} specifications
          </h2>
          <SpecTable vehicle={vehicle} />
        </section>
      </div>
    </>
  )
}

function VehicleSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-5 w-64 animate-pulse rounded bg-hairline" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-4/3 animate-pulse rounded-xl bg-surface-alt" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-hairline" />
          <div className="h-8 w-40 animate-pulse rounded bg-hairline" />
          <div className="h-24 animate-pulse rounded-xl bg-surface-alt" />
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

function Gallery({ images, title }: { images: string[]; title: string }) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-xl bg-surface-alt text-sm text-ink-subtle">
        No images available
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-surface-alt">
        <Image
          src={images[0]}
          alt={title}
          fill
          // The hero is the LCP element on this page; priority stops it
          // queueing behind the thumbnails.
          priority
          sizes="(min-width: 1024px) 560px, 92vw"
          className="object-contain p-6"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3">
          {images.slice(1, 5).map((src, i) => (
            <li
              key={src}
              className="relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface-alt"
            >
              <Image
                src={src}
                alt={`${title} photo ${i + 2}`}
                fill
                sizes="140px"
                className="object-contain p-2"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Product structured data. This is what earns the price and rating chips in
 * Google results, which is most of the click-through advantage a listing page
 * has over a competitor's.
 */
function JsonLd({ vehicle }: { vehicle: Vehicle }) {
  const title = vehicleTitle(vehicle)
  const price = schemaPrice(vehicle)
  const image = primaryImage(vehicle)

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    url: `${SITE_URL}${vehicleHref(vehicle)}`,
    ...(image ? { image: [image] } : {}),
    ...(vehicle.brand?.name
      ? { brand: { '@type': 'Brand', name: vehicle.brand.name } }
      : {}),
    ...(vehicle.description ? { description: vehicle.description } : {}),
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price,
            availability: 'https://schema.org/InStock',
            url: `${SITE_URL}${vehicleHref(vehicle)}`,
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      // Content is built from our own API, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
