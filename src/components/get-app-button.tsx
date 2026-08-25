import { PLAY_STORE_URL } from '@/lib/site'

/**
 * The Play Store badge.
 *
 * Every "Get the app" on the site used to be a filled indigo button with a
 * text label — which reads as a generic site action, not as a link to a store
 * listing. The store badge is a lockup people have been trained on for a
 * decade: the mark says "this installs an app" before any of the words are
 * read, and it is the shape a reader is already scanning for.
 *
 * Two tones because the site has two grounds. Dark badge on the light catalog
 * (the store's own default), light badge on the near-black chrome — a black
 * badge on the header would disappear into it.
 *
 * BRAND NOTE: Google publishes official badge artwork with usage rules
 * (proportions, clear space, no recolouring). This is a faithful reproduction
 * of that lockup, not the asset itself. If you want strict compliance, drop the
 * official SVG into /public and swap the markup below for an <Image> — the
 * component boundary exists so that is a one-file change.
 */
export function GetAppButton({
  tone = 'dark',
  size = 'md',
  label = 'Get the VGO app on Google Play',
  className = '',
}: {
  tone?: 'dark' | 'light'
  size?: 'sm' | 'md'
  /**
   * Accessible name. The visible text is the store's own untranslated lockup,
   * so the localized wording lives here rather than being rendered.
   */
  label?: string
  className?: string
}) {
  const small = size === 'sm'

  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={[
        'inline-flex shrink-0 items-center gap-2.5 rounded-control border transition-colors',
        small ? 'px-3 py-1.5' : 'px-4 py-2.5',
        tone === 'dark'
          ? 'border-ink bg-ink text-white hover:bg-black'
          : 'border-white/25 bg-white text-ink hover:border-white/50 hover:bg-white/90',
        className,
      ].join(' ')}
    >
      <PlayGlyph className={small ? 'size-5' : 'size-6'} />

      {/*
        The two-line lockup, with the small line optically aligned to the top of
        the wordmark. Tracking on the upper line is what stops it reading as a
        second word rather than as a label.
      */}
      <span className="flex flex-col items-start leading-none">
        <span
          className={`font-medium tracking-[0.08em] ${
            small ? 'text-[0.5rem]' : 'text-[0.5625rem]'
          } ${tone === 'dark' ? 'text-white/70' : 'text-ink-muted'}`}
        >
          GET IT ON
        </span>
        <span
          className={`mt-0.5 font-semibold tracking-[-0.01em] ${
            small ? 'text-[0.8125rem]' : 'text-[0.9375rem]'
          }`}
        >
          Google Play
        </span>
      </span>
    </a>
  )
}

/**
 * The Play mark: one triangle split into four by lines meeting at its centre.
 * Blue is the left wedge, green the top, yellow the right, red the bottom —
 * the order matters, it is what makes the shape recognisable at 20px.
 */
export function PlayGlyph({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="#00A0FF"
        d="M3.609 1.814 13.792 12 3.609 22.186A1.494 1.494 0 0 1 3 20.976V3.024c0-.474.24-.897.609-1.21z"
      />
      <path
        fill="#00E676"
        d="M17.28 8.513 5.157 1.694c-.528-.3-1.128-.24-1.548.12L13.792 12l3.488-3.487z"
      />
      <path
        fill="#FFCE00"
        d="M17.28 15.487 13.792 12l3.488-3.487 4.087 2.32c.6.34.933.87.933 1.417 0 .548-.333 1.078-.933 1.418l-4.087 2.32z"
      />
      <path
        fill="#FF3A44"
        d="M17.28 15.487 3.609 22.186c.42.36 1.02.42 1.548.12L17.28 15.487z"
      />
    </svg>
  )
}
