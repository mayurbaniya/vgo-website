'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n/dictionaries'

type Status = 'idle' | 'working' | 'error'

/**
 * The sign-in dialog: one button, no form.
 *
 * There is no separate register path because the backend does not need one —
 * `/user/auth/google-sign-in` looks the email up and creates the account if it
 * is new. So "Log in" and "Register" are the same click, and the copy says so
 * rather than making people decide which one they are.
 *
 * Built on <dialog> for the modal behaviour the platform already implements:
 * focus trapping, Escape to close, inert background, and the top layer, which
 * puts it above the sticky header without a z-index competition.
 */
export function AuthDialog({
  open,
  onClose,
  dict,
}: {
  open: boolean
  onClose: () => void
  dict: Dictionary
}) {
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  // showModal() is what puts the element in the top layer and traps focus;
  // rendering it with an `open` attribute instead gives a non-modal dialog
  // that the header would still overlap.
  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (open && !element.open) {
      element.showModal()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setMessage(null)
    }
  }, [open])

  async function handleSignIn() {
    setStatus('working')
    setMessage(null)

    // Imported here, not at module scope: this is the click that justifies
    // paying for the Firebase bundle.
    const { signInWithGoogle, isFirebaseConfigured, SignInCancelled, PopupBlocked } =
      await import('@/lib/firebase')

    if (!isFirebaseConfigured()) {
      setStatus('error')
      setMessage(dict.auth.unconfigured)
      return
    }

    try {
      const credential = await signInWithGoogle()

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      })

      if (!response.ok) throw new Error(`session exchange failed: ${response.status}`)

      onClose()
      // The header reads the session server-side, so the new state arrives by
      // re-rendering the route rather than by setting any client state here.
      router.refresh()
    } catch (error) {
      if (error instanceof SignInCancelled) {
        // Not a failure — they changed their mind. Close quietly.
        setStatus('idle')
        onClose()
        return
      }
      setStatus('error')
      setMessage(error instanceof PopupBlocked ? dict.auth.popupBlocked : dict.auth.failed)
      if (!(error instanceof PopupBlocked)) console.error('[auth]', error)
    }
  }

  return (
    <dialog
      ref={ref}
      // Backdrop clicks land on the dialog element itself, so compare the
      // target to filter out clicks that came from the panel inside it.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      onClose={onClose}
      aria-labelledby="auth-dialog-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card border border-hairline bg-surface p-0 text-ink backdrop:bg-ground/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id="auth-dialog-title" className="display-sm text-xl text-ink">
          {dict.auth.dialogTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {dict.auth.dialogSubtitle}
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={status === 'working'}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-control border border-hairline bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleMark className="size-5 shrink-0" />
          {status === 'working' ? dict.auth.working : dict.auth.continueWithGoogle}
        </button>

        {message && (
          <p role="alert" className="mt-4 text-sm leading-relaxed text-danger">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-control px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          {dict.auth.close}
        </button>
      </div>
    </dialog>
  )
}

/** Google's mark, in its own colours — the one place brand colour is not ours. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.04-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.04 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
