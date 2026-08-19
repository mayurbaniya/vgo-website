import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 text-ink-muted">
        The vehicle or page you were looking for may have been removed, or the
        link might be wrong.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/bikes"
          className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          Browse bikes
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-brand-200 px-5 py-2.5 font-semibold text-brand-700 hover:bg-brand-50"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
