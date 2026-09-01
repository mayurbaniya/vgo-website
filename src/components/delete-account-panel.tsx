'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthDialog } from './auth-dialog'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { SessionUser } from '@/lib/session'

type Status = 'idle' | 'confirming' | 'working' | 'done' | 'error'

/**
 * The actual account-deletion request Google Play's Data Safety form links
 * to — a live flow, not just instructions. Signing in re-uses the same
 * Google session as the rest of the site, so a reader who arrives here
 * without the app installed can still delete their account and data.
 *
 * Accounts created with phone/email+password (most VGO signups — see
 * SignInService.googleSignIn) can't complete Google sign-in here; the
 * sign-in error path already explains that, and the page's email fallback
 * covers them.
 */
export function DeleteAccountPanel({
  user,
  dict,
}: {
  user: SessionUser | null
  dict: Dictionary
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleDelete() {
    setStatus('working')
    setMessage(null)
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `request failed: ${response.status}`)
      }
      setStatus('done')
      router.refresh()
    } catch (error) {
      console.error('[delete-account]', error)
      setStatus('error')
      setMessage(
        'Something went wrong deleting your account. Please try again, or email support@vgomobility.in from your registered address.',
      )
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-card border border-hairline bg-surface p-6">
        <p className="text-sm font-medium text-ink">Your account has been deleted.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your saved vehicles are gone and your name, email and phone number
          have been replaced with anonymized values. Vehicle enquiries you
          made are kept for up to 60 days for dealer follow-up, then deleted
          automatically.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-card border border-hairline bg-surface p-6">
        <p className="text-sm leading-relaxed text-ink-muted">
          Sign in with the Google account linked to your VGO account to
          delete it and its data from here.
        </p>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="mt-4 rounded-control border border-hairline bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt"
        >
          Sign in with Google
        </button>
        <AuthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} dict={dict} />
      </div>
    )
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-6">
      <p className="micro text-ink-subtle">Signed in as</p>
      <p className="text-sm font-medium text-ink">{user.email}</p>

      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted">
        <li>Your saved vehicles are deleted immediately.</li>
        <li>You&apos;re signed out of every device.</li>
        <li>Your name, email and phone number are replaced with anonymized values.</li>
        <li>
          Vehicle enquiries you&apos;ve made are kept for up to 60 days for
          dealer follow-up, then deleted automatically.
        </li>
      </ul>
      <p className="mt-4 text-sm font-medium text-ink">This cannot be undone.</p>

      {status === 'idle' || status === 'error' ? (
        <button
          type="button"
          onClick={() => setStatus('confirming')}
          className="mt-6 rounded-control border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          Delete my account and data
        </button>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={status === 'working'}
            className="rounded-control border border-ink bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'working' ? 'Deleting…' : 'Yes, permanently delete'}
          </button>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            disabled={status === 'working'}
            className="rounded-control px-4 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {message && (
        <p role="alert" className="mt-4 text-sm leading-relaxed text-danger">
          {message}
        </p>
      )}
    </div>
  )
}
