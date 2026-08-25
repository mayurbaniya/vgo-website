import Link from 'next/link'

/**
 * The wordmark carries the accent so the brand colour is stated once, at the
 * top of every page, and can stay out of the catalog below.
 *
 * Its own module rather than an export from site-header, because the footer
 * uses it too and the footer is a `use cache` component. Importing it from the
 * header would drag that file's `next/headers` dependency — cookies for the
 * language and the session — into a cached scope that must never read a
 * request.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`display text-xl leading-none tracking-[-0.04em] text-ground-ink ${className}`}
    >
      <span className="text-signal">V</span>GO
    </Link>
  )
}
