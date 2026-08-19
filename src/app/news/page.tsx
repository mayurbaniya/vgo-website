import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { getNews } from '@/lib/api'
import { PageHeader } from '@/components/vehicle-listing'

export const metadata: Metadata = {
  title: 'Automotive News',
  description:
    'Two-wheeler launches, price changes and industry news for riders in India.',
  alternates: { canonical: '/news' },
}

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="News"
        description="Launches, price changes and industry updates."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
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
    return (
      <p className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-ink-subtle">
        No articles right now. Check back soon.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => {
        // The feed is syndicated, so items carry an external url and may not
        // have a stable id — fall back to url, then index, for the key.
        const key = article.id ?? article.url ?? i
        const body = (
          <>
            {article.imageURL && (
              <div className="relative aspect-video bg-surface-alt">
                <Image
                  src={article.imageURL}
                  alt={article.title ?? 'Article'}
                  fill
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h2 className="clamp-2 font-semibold text-ink">{article.title}</h2>
              {article.description && (
                <p className="clamp-2 mt-1 text-sm text-ink-muted">
                  {article.description}
                </p>
              )}
            </div>
          </>
        )

        return (
          <li
            key={key}
            className="overflow-hidden rounded-xl border border-hairline bg-surface transition-shadow hover:shadow-lg"
          >
            {article.url ? (
              // Syndicated content on someone else's domain: nofollow keeps us
              // from passing ranking signal out on every feed item.
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block"
              >
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ul>
  )
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-xl border border-hairline bg-surface-alt"
        />
      ))}
    </div>
  )
}
