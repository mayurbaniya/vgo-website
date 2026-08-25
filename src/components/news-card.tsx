import type { NewsArticle } from '@/lib/types'

/**
 * A syndicated news item.
 *
 * The feed carries a headline, a blurb, a publisher and a link — no image and
 * no stable id. Rather than fake artwork, the card leans on type: the source is
 * set as an eyebrow, the headline gets room to be the object, and the whole
 * thing is sized so a row of them reads as a wire feed rather than as a row of
 * empty image frames.
 *
 * rel="nofollow" because every one of these points off our domain, on every
 * item, forever.
 */
export function NewsCard({ article }: { article: NewsArticle }) {
  const published = formatPublished(article.publishedAt)
  const meta = [article.source, published].filter(Boolean).join(' · ')

  const body = (
    <>
      <p className="micro text-signal">{meta || 'News'}</p>
      <h3 className="display-sm clamp-3 mt-2 text-[0.9375rem] leading-snug text-ink">
        {cleanText(article.title)}
      </h3>
      {article.description && (
        <p className="clamp-2 mt-2 text-sm text-ink-muted">
          {cleanText(article.description)}
        </p>
      )}
      <span className="micro mt-4 block text-ink-subtle">Read on {article.source ?? 'source'} →</span>
    </>
  )

  return (
    <article className="card card-interactive h-full">
      {article.url ? (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex h-full flex-col p-4"
        >
          {body}
        </a>
      ) : (
        <div className="flex h-full flex-col p-4">{body}</div>
      )}
    </article>
  )
}

/**
 * The upstream RSS bridge double-escapes entities and repeats the publisher
 * name inside the headline ("… - Autocar India"), which the eyebrow already
 * shows. Both are stripped so the card is not showing the same words twice.
 */
function cleanText(raw?: string): string {
  if (!raw) return ''
  return raw
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s+-\s+[^-]{2,30}$/, '')
    .trim()
}

function formatPublished(raw?: string): string | null {
  if (!raw) return null
  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed)) return null

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parsed)
}
