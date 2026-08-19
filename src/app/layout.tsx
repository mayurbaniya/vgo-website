import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SITE_NAME, SITE_URL } from '@/lib/site'

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
    default: `${SITE_NAME} — Bike & Scooter Prices, Specs and Offers in Nagpur`,
    // Page titles fill the %s; keeps the brand suffix consistent site-wide.
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Compare bikes, scooters and electric two-wheelers in Nagpur. On-road prices, full specifications, mileage, reviews and dealer offers.',
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
