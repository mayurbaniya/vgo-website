import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getNews } from '@/lib/api'
import { NewsCard } from '@/components/news-card'
import { EmptyState } from '@/components/vehicle-grid'
import { PageHeader } from '@/components/vehicle-listing'

export const metadata: Metadata = {
  title: 'Two-Wheeler News',
  description:
    'Launches, price changes and industry news for two-wheeler riders in India, gathered from the motoring press.',
  alternates: { canonical: '/news' },
}

export default function NewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="From the motoring press"
        title="News and launches"
        description="Headlines gathered from other publications. Every story opens on the site that wrote it."
      />
      <div className="shell py-8">
        <Suspense fallback={<NewsSkeleton />}>
          <Articles />
        </Suspense>
      </div>
    </>
  )
}

async function Articles() {
  const articles = await getNews()

  if (articles.length === 0) {
    return <EmptyState message="No articles right now. The feed refreshes through the day — check back shortly." />
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, i) => (
        // The feed carries no stable id, so the external url is the key with
        // the index as a last resort.
        <li key={article.url ?? i}>
          <NewsCard article={article} />
        </li>
      ))}
    </ul>
  )
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="shimmer h-52 rounded-card" />
      ))}
    </div>
  )
}
