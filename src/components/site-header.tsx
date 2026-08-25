import Link from 'next/link'
import { Suspense } from 'react'
import { Wordmark } from './wordmark'
import { NavLinks } from './site-nav'
import { ActiveNav } from './site-nav-active'
import { navPanels } from './nav-panels'
import { SearchBox } from './search-box'
import { AuthButton } from './auth-button'
import { LanguageSwitcher } from './language-switcher'
import { GetAppButton } from './get-app-button'
import {
  DEFAULT_LANGUAGE,
  getDictionary,
  type Dictionary,
  type LanguageCode,
} from '@/lib/i18n/dictionaries'
import { getLanguage } from '@/lib/i18n/server'
import { getSessionUser, type SessionUser } from '@/lib/session'

/** English, prerendered into the static shell as every boundary's fallback. */
const FALLBACK_DICT = getDictionary(DEFAULT_LANGUAGE)

/**
 * Site chrome.
 *
 * Two tiers, which is the shape every two-wheeler portal settles on: the
 * catalog on top (and the mega-menus that open it), the things you *do* below
 * it — compare, EMI, on-road price. Keeping tools out of the primary nav is
 * what stops that row growing to nine items and meaning nothing.
 *
 * `relative` on the header is load-bearing: the mega-menu panels position
 * against it with `top-full`, so they open under the whole two-tier bar rather
 * than under an individual link.
 *
 * Both the reader's language and their session live in cookies, and under Cache
 * Components reading a cookie outside a `<Suspense>` boundary stops the route
 * being prerendered — from the root layout, that would cost every page on the
 * site its static shell. So every cookie read sits behind a boundary whose
 * fallback is the signed-out English header. Crawlers and first paint get that
 * shell; the reader's actual language and name stream over it.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-ground/95 backdrop-blur supports-[backdrop-filter]:bg-ground/80">
      <div className="shell-bleed flex h-16 items-center gap-4">
        <Wordmark />

        <Suspense
          fallback={<NavLinks variant="bar" pathname={null} dict={FALLBACK_DICT} />}
        >
          <LocalizedNav variant="bar" />
        </Suspense>

        <Suspense
          fallback={
            <HeaderControls
              dict={FALLBACK_DICT}
              language={DEFAULT_LANGUAGE}
              user={null}
            />
          }
        >
          <LocalizedControls />
        </Suspense>
      </div>

      <Suspense fallback={<UtilityBar dict={FALLBACK_DICT} />}>
        <LocalizedUtilityBar />
      </Suspense>

      {/*
        Mobile nav. A horizontally scrollable strip rather than a hamburger: six
        destinations is few enough that hiding them behind a tap costs more than
        it saves, and the links stay in the DOM for crawlers either way.
      */}
      <Suspense
        fallback={<NavLinks variant="strip" pathname={null} dict={FALLBACK_DICT} />}
      >
        <LocalizedNav variant="strip" />
      </Suspense>
    </header>
  )
}

async function LocalizedNav({ variant }: { variant: 'bar' | 'strip' }) {
  const language = await getLanguage()
  return (
    <ActiveNav
      variant={variant}
      dict={getDictionary(language)}
      // Rendered on the server and handed across the client boundary as
      // markup, so the menus cost nothing in the bundle.
      panels={variant === 'bar' ? navPanels() : undefined}
    />
  )
}

async function LocalizedUtilityBar() {
  const language = await getLanguage()
  return <UtilityBar dict={getDictionary(language)} />
}

async function LocalizedControls() {
  // One await, not two sequential ones: the session and the language come from
  // the same cookie jar and neither depends on the other.
  const [language, user] = await Promise.all([getLanguage(), getSessionUser()])
  return (
    <HeaderControls dict={getDictionary(language)} language={language} user={user} />
  )
}

/**
 * The second tier: the calculators and the compare table.
 *
 * Hidden below `md`, where the primary strip already fills the width — on a
 * phone these are reachable from the home page's tools band and from the
 * footer, and a second scrolling row of links under the first would push the
 * catalog off the screen entirely.
 */
function UtilityBar({ dict }: { dict: Dictionary }) {
  const links = [
    { href: '/compare', label: dict.tools.compare },
    { href: '/emi-calculator', label: dict.tools.emi },
    { href: '/on-road-price', label: dict.tools.onRoad },
  ]

  return (
    <div className="hidden border-t border-white/8 md:block">
      <div className="shell-bleed flex h-10 items-center gap-1">
        <span className="micro mr-2 text-white/30">{dict.tools.label}</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-chip px-2.5 py-1 text-xs font-medium text-ground-muted transition-colors hover:bg-white/8 hover:text-ground-ink"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/**
 * The right-hand cluster: search, sign-in, language, app.
 *
 * Ordered by how often it is wanted, left to right, with the store badge last
 * so the bar has a single obvious end. Sign-in and language stay as text
 * controls: the badge is the one thing here with a shape, and giving it
 * competition would leave the header with two primary actions and no obvious
 * first move. Nothing on this site needs an account to read.
 */
function HeaderControls({
  dict,
  language,
  user,
}: {
  dict: Dictionary
  language: LanguageCode
  user: SessionUser | null
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      {/* Search takes the middle of the bar from lg up, where there is room for
          it without squeezing the nav. Below that it lives in the hero and on
          /search. */}
      <div className="mr-2 hidden w-64 lg:block xl:w-80">
        <SearchBox
          placeholder={dict.search.placeholder}
          label={dict.search.label}
          submitLabel={dict.search.submit}
        />
      </div>

      <AuthButton user={user} dict={dict} />
      <LanguageSwitcher current={language} dict={dict} />

      {/* The store badge, light tone — a black badge would vanish into the
          near-black bar. `label` carries the reader's language; the visible
          lockup is the store's own and stays untranslated. */}
      <GetAppButton tone="light" size="sm" label={dict.header.getApp} className="ml-2" />
    </div>
  )
}
