'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

/**
 * The model gallery.
 *
 * Catalog photography arrives from admins in every possible crop and lighting,
 * so every frame sits on the same neutral plate at the same inset — that
 * consistency is what makes three photos read as one set rather than as three
 * uploads.
 *
 * The lightbox exists because the images are the second thing anyone looks at
 * after the price, and a 4:3 thumbnail at half the column width is not enough
 * to judge a bike by. Arrow keys work, Escape closes, and focus is put on the
 * dialog so a keyboard user is not left behind on the page underneath.
 */
export function Gallery({
  images,
  title,
}: {
  images: string[]
  title: string
}) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const step = useCallback(
    (delta: number) => {
      setActive((current) => (current + delta + images.length) % images.length)
    },
    [images.length],
  )

  useEffect(() => {
    if (!zoomed) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setZoomed(false)
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [zoomed, step])

  if (images.length === 0) {
    return (
      <div className="plate flex aspect-4/3 items-center justify-center rounded-card border border-hairline text-sm text-ink-subtle">
        No images available
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`View ${title} photos full size`}
        className="plate group relative block aspect-4/3 w-full overflow-hidden rounded-card border border-hairline"
      >
        <Image
          src={images[active]}
          alt={title}
          fill
          // The LCP element on this page; priority stops it queueing behind the
          // thumbnails underneath it.
          priority
          sizes="(min-width: 1024px) 620px, 92vw"
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="micro absolute bottom-3 right-3 rounded-chip bg-ground/80 px-2 py-1 text-ground-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          Expand
        </span>
        <span className="micro tnum absolute bottom-3 left-3 rounded-chip bg-ground/70 px-2 py-1 text-ground-ink backdrop-blur">
          {active + 1} / {images.length}
        </span>
      </button>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === active}
                className={`plate relative block aspect-square w-full overflow-hidden rounded-[8px] border transition-colors ${
                  i === active ? 'border-ink' : 'border-hairline hover:border-ink/30'
                }`}
              >
                <Image src={src} alt="" fill sizes="120px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          className="fixed inset-0 z-[60] flex flex-col bg-ground/95 backdrop-blur"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="micro tnum text-white/50">
              {title} · {active + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close"
              autoFocus
              className="rounded-control p-2 text-white/60 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>

          <div className="relative flex-1">
            <Image
              src={images[active]}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain p-4"
            />

            {images.length > 1 && (
              <>
                <Arrow direction="prev" onClick={() => step(-1)} />
                <Arrow direction="next" onClick={() => step(1)} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Arrow({
  direction,
  onClick,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous photo' : 'Next photo'}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-3 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white ${
        direction === 'prev' ? 'left-4' : 'right-4'
      }`}
    >
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === 'prev' ? 'm12 4-6 6 6 6' : 'm8 4 6 6-6 6'} />
      </svg>
    </button>
  )
}
