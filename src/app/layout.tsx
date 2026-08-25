import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CompareTray } from '@/components/compare-tray'
import { getCatalogSnapshot } from '@/lib/catalog'
import { HtmlLangSync } from '@/components/html-lang'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { DEFAULT_LANGUAGE, languageMeta } from '@/lib/i18n/dictionaries'
import { getLanguage } from '@/lib/i18n/server'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

/**
 * Archivo carries every heading, price and spec figure. It is a grotesque cut
 * for signage and press material — the register two-wheeler brochures are
 * already written in — and it holds up at the display sizes the hero needs
 * without the wideness Inter develops when it gets big.
 */
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  // metadataBase makes every relative OG/canonical URL below resolve to an
  // absolute one. Without it Next warns and social cards break.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Bike & Scooter Prices, Specs and Offers in India`,
    // Page titles fill the %s; keeps the brand suffix consistent site-wide.
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Compare bikes, scooters and electric two-wheelers in India. Ex-showroom prices, full specifications, mileage, reviews and dealer offers.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

/**
 * The header, hero and footer are all near-black, so the mobile browser bar is
 * tinted to match and the page starts at the top of the screen rather than
 * under a white strip. colorScheme repeats the CSS declaration for user agents
 * that read the meta tag first.
 */
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0a0c12',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${archivo.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        {/*
          Every language-dependent region sits behind its own boundary with an
          English fallback, so the static shell stays static. See the note on
          getLanguage() in lib/i18n/server.ts.
        */}
        <Suspense fallback={null}>
          <LocalizedHtmlLang />
        </Suspense>

        <SiteHeader />
        <main className="flex-1">{children}</main>

        {/*
          The compare tray is mounted once, site-wide, and renders nothing until
          something is shortlisted — the shortlist lives in localStorage, so the
          server cannot know whether it is empty. It is given the catalog
          reduced to id/name/thumbnail so a chip can say "Bajaj Pulsar NS200"
          instead of "#5" without a round trip per id.
        */}
        <Suspense fallback={null}>
          <CompareTrayMount />
        </Suspense>

        <Suspense fallback={<SiteFooter language={DEFAULT_LANGUAGE} />}>
          <LocalizedFooter />
        </Suspense>
      </body>
    </html>
  )
}

async function LocalizedHtmlLang() {
  const language = await getLanguage()
  return <HtmlLangSync lang={languageMeta(language).htmlLang} />
}

async function CompareTrayMount() {
  const snapshot = await getCatalogSnapshot()

  return (
    <CompareTray
      index={snapshot.vehicles.map((entry) => ({
        id: entry.id,
        title: entry.title,
        image: entry.vehicle.images?.find(Boolean) ?? null,
      }))}
    />
  )
}

async function LocalizedFooter() {
  // Resolved here and passed down, which makes the language part of the
  // footer's cache key instead of something it reads from a request it does
  // not have.
  return <SiteFooter language={await getLanguage()} />
}
