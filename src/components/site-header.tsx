import Link from 'next/link'
import { Suspense } from 'react'
import { NavLinks } from './site-nav'
import { ActiveNav } from './site-nav-active'
import { SearchBox } from './search-box'
import { PLAY_STORE_URL } from '@/lib/site'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ground/95 backdrop-blur supports-[backdrop-filter]:bg-ground/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Wordmark />
        <Suspense fallback={<NavLinks variant="bar" pathname={null} />}>
          <ActiveNav variant="bar" />
        </Suspense>

        {/* Search takes the middle of the bar from lg up, where there is room
            for it without squeezing the nav. Below that it lives in the hero
            and on /search. */}
        <div className="ml-auto hidden w-64 lg:block xl:w-80">
          <SearchBox />
        </div>

        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500 lg:ml-3"
        >
          Get the app
        </a>
      </div>

      {/*
        Mobile nav. A horizontally scrollable strip rather than a hamburger:
        six destinations is few enough that hiding them behind a tap costs more
        than it saves, and the links stay in the DOM for crawlers either way.
      */}
      <Suspense fallback={<NavLinks variant="strip" pathname={null} />}>
        <ActiveNav variant="strip" />
      </Suspense>
    </header>
  )
}

/**
 * The wordmark carries the accent so the brand colour is stated once, at the
 * top of every page, and can stay out of the catalog below.
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
