'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLanguage } from '@/lib/i18n/actions'
import {
  LANGUAGES,
  languageMeta,
  type Dictionary,
  type LanguageCode,
} from '@/lib/i18n/dictionaries'

/**
 * Language control for the header.
 *
 * A menu rather than a two-state toggle. With exactly two languages a toggle
 * would be smaller, but it can only ever show one of them — the reader has to
 * work out that the button shows the language they would switch *to*, or the
 * one they are already in. A menu states both and stays correct when a third
 * language is added.
 *
 * The current language is resolved on the server and passed in, so this never
 * reads the cookie itself and the header has no hydration mismatch to manage.
 */
export function LanguageSwitcher({
  current,
  dict,
}: {
  current: LanguageCode
  dict: Dictionary
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Escape closes, wherever focus happens to be. Click-outside is handled by
  // the catcher element below.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  function choose(code: LanguageCode) {
    setOpen(false)
    if (code === current) return

    startTransition(async () => {
      await setLanguage(code)
      // The chrome reads the cookie on the server, so the new language arrives
      // by re-rendering the route. Without this the cookie changes and the
      // page carries on showing the language it was rendered with.
      router.refresh()
    })
  }

  const active = languageMeta(current)

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.header.changeLanguage}
        disabled={pending}
        className="flex items-center gap-1 rounded-control px-2 py-2 text-sm font-medium text-ground-muted transition-colors hover:text-ground-ink disabled:opacity-60"
      >
        <GlobeIcon className="size-4 shrink-0" />
        <span>{active.short}</span>
        <ChevronIcon className={`size-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            aria-label={dict.header.language}
            className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-card border border-hairline bg-surface py-1 shadow-[0_18px_40px_-24px_rgb(20_22_31_/_0.45)]"
          >
            {LANGUAGES.map((language) => {
              const selected = language.code === current
              return (
                <button
                  key={language.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => choose(language.code)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-alt ${
                    selected ? 'font-semibold text-ink' : 'text-ink-muted'
                  }`}
                >
                  {/* Each language names itself in its own script — someone
                      looking for Hindi is looking for "हिंदी", not "Hindi". */}
                  <span>{language.label}</span>
                  {selected && <CheckIcon className="size-4 shrink-0 text-signal" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}
