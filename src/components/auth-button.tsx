'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthDialog } from './auth-dialog'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { SessionUser } from '@/lib/session'

/**
 * Header sign-in control.
 *
 * A text button, deliberately: the bar already has one filled button in "Get
 * the app", and a second would leave the header with two competing primary
 * actions and no obvious first move. Signing in is a supporting action here —
 * nothing on this site requires an account to read.
 *
 * `user` is resolved on the server and passed down, so the signed-out state
 * renders into the static shell and the real one streams over it. This
 * component never fetches the session itself.
 */
export function AuthButton({
  user,
  dict,
}: {
  user: SessionUser | null
  dict: Dictionary
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setMenuOpen(false)
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="shrink-0 whitespace-nowrap rounded-control px-2 py-2 text-sm font-medium text-ground-muted transition-colors hover:text-ground-ink"
        >
          {dict.header.signIn}
        </button>
        <AuthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} dict={dict} />
      </>
    )
  }

  // First name only. The header is tight and a full name pushes the language
  // control and the app button around on narrow screens.
  const firstName = user.name.trim().split(/\s+/)[0]

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-control px-2 py-1.5 text-sm font-medium text-ground-muted transition-colors hover:text-ground-ink"
      >
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        >
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-24 truncate sm:block">{firstName}</span>
      </button>

      {menuOpen && (
        <>
          {/* Click-catcher rather than a document listener: one element, no
              effect to clean up, and it cannot outlive the open menu. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-hairline bg-surface py-1 shadow-[0_18px_40px_-24px_rgb(20_22_31_/_0.45)]"
          >
            <div className="border-b border-hairline px-3 py-2.5">
              <p className="micro text-ink-subtle">{dict.auth.signedInAs}</p>
              <p className="truncate text-sm font-medium text-ink">{user.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-alt disabled:opacity-60"
            >
              {dict.header.logOut}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
