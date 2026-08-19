import type { Metadata } from 'next'
import { PageHeader } from '@/components/vehicle-listing'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses and protects your personal information.`,
  alternates: { canonical: '/privacy-policy' },
}

/**
 * ⚠️ DRAFT — needs a legal review before the Play Store submission cites it.
 *
 * The content below is written to match what the app actually does (the fields
 * the signup flow collects, Firebase Analytics, FCM tokens, Google Sign-In),
 * not from a generic template. Anything that could not be verified from the
 * code is marked with a TODO rather than invented — do not publish guesses
 * about retention periods or third-party processors.
 *
 * Google Play requires this page to be publicly reachable at a stable URL, and
 * requires the account-deletion route described in the "Deleting your account"
 * section to actually work.
 */
export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="How we collect, use and protect your personal information."
      />

      <article className="mx-auto max-w-3xl px-4 py-10 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-3 [&_p]:text-ink-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5 [&_li]:text-ink-muted">
        <p className="text-sm text-ink-subtle">Last updated: 15 August 2026</p>

        <p>
          This policy explains what information {SITE_NAME} (operated by VGO Pvt
          Ltd, Nagpur, Maharashtra, India) collects when you use our website and
          mobile app, why we collect it, and the choices you have.
        </p>

        <h2>Information we collect</h2>
        <p>
          <strong>Browsing this website</strong> does not require an account. We
          do not ask for personal information to view vehicle listings, prices
          or specifications.
        </p>
        <p>
          <strong>If you create an account in our mobile app</strong>, we
          collect:
        </p>
        <ul>
          <li>Your name and email address</li>
          <li>Your phone number</li>
          <li>Your city and age, used to show relevant pricing and listings</li>
          <li>
            Your Google account email, if you choose to sign in with Google
          </li>
          <li>
            A device notification token, so we can send price alerts you have
            asked for
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To create and secure your account</li>
          <li>
            To show on-road prices and availability for your city
          </li>
          <li>
            To pass an enquiry to a dealer when you choose to express interest in
            a vehicle
          </li>
          <li>
            To send notifications you have opted into, such as price-drop alerts
            on saved vehicles
          </li>
          <li>
            To understand how the app is used in aggregate, so we can improve it
          </li>
        </ul>
        <p>
          We do not sell your personal information.
        </p>

        <h2>Sharing with dealers</h2>
        <p>
          When you mark interest in a vehicle, we share the details needed to
          contact you — typically your name, phone number and the vehicle you
          enquired about — with the relevant dealership. This only happens as a
          result of an action you take.
        </p>

        <h2>Service providers</h2>
        <p>
          We use Google Firebase for authentication, push notifications, remote
          configuration and analytics. Their handling of data is governed by
          Google&apos;s own privacy policy. Our servers and file storage are
          hosted on Amazon Web Services.
        </p>

        <h2>Deleting your account</h2>
        <p>
          You can ask us to delete your account and the personal information
          associated with it at any time. Email{' '}
          <a
            className="font-medium text-brand-700 underline"
            href="mailto:support@vgomobility.in"
          >
            support@vgomobility.in
          </a>{' '}
          from the address registered on your account and we will action the
          request.
        </p>
        <p>
          {/* TODO: replace once the in-app deletion flow ships — Play requires
              an in-app route in addition to this web one. */}
          When we delete an account, the profile, saved vehicles and enquiry
          history associated with it are removed.
        </p>

        <h2>Security</h2>
        <p>
          Access to your account is protected by an authentication token, and
          passwords are stored only in hashed form — we cannot read them.
        </p>

        <h2>Children</h2>
        <p>
          {SITE_NAME} is not directed at children under 13, and we do not
          knowingly collect their personal information.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If we make material changes we will update the date at the top of this
          page and, where appropriate, notify you in the app.
        </p>

        <h2>Contact us</h2>
        <p>
          VGO Pvt Ltd
          <br />
          Hajaripahad, Nagpur, Maharashtra 440007, India
          <br />
          <a
            className="font-medium text-brand-700 underline"
            href="mailto:support@vgomobility.in"
          >
            support@vgomobility.in
          </a>
        </p>
      </article>
    </>
  )
}
