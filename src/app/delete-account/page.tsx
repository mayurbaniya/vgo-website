import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/vehicle-listing'
import { DeleteAccountPanel } from '@/components/delete-account-panel'
import { SITE_NAME } from '@/lib/site'
import { DEFAULT_LANGUAGE, getDictionary } from '@/lib/i18n/dictionaries'
import { getLanguage } from '@/lib/i18n/server'
import { getSessionUser } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Delete Account',
  description: `Request deletion of your ${SITE_NAME} account and data.`,
  alternates: { canonical: '/delete-account' },
}

const FALLBACK_DICT = getDictionary(DEFAULT_LANGUAGE)

/**
 * The link Google Play's Data Safety form wants for "request account and
 * data deletion" — a page that works without the app installed. See
 * DeleteAccountPanel for the actual flow; this route just resolves the
 * session (behind Suspense, since reading cookies here would otherwise
 * opt the whole route out of prerendering) and hands it down.
 */
export default function DeleteAccountPage() {
  return (
    <>
      <PageHeader
        title="Delete your account"
        description="Permanently delete your VGO account and the data tied to it."
      />

      <div className="mx-auto max-w-xl px-4 py-10">
        <Suspense fallback={<DeleteAccountPanel user={null} dict={FALLBACK_DICT} />}>
          <DeleteAccountResolved />
        </Suspense>

        <p className="mt-6 text-sm leading-relaxed text-ink-subtle">
          Signed up with a phone number instead of Google? Delete your account
          from the app instead — Settings → Delete Account — or email{' '}
          <a
            className="font-medium text-brand-700 underline"
            href="mailto:support@vgomobility.in"
          >
            support@vgomobility.in
          </a>{' '}
          from your registered address and we&apos;ll delete it for you. See
          our{' '}
          <a className="font-medium text-brand-700 underline" href="/privacy-policy">
            Privacy Policy
          </a>{' '}
          for the full details of what deletion does.
        </p>
      </div>
    </>
  )
}

async function DeleteAccountResolved() {
  const [language, user] = await Promise.all([getLanguage(), getSessionUser()])
  return <DeleteAccountPanel user={user} dict={getDictionary(language)} />
}
