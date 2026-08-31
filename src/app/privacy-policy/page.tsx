import type { Metadata } from 'next'
import { PageHeader } from '@/components/vehicle-listing'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses and protects your personal information.`,
  alternates: { canonical: '/privacy-policy' },
}

/**
 * Content is synced to what the app and backend actually do (vehicle_/lib and
 * niku_repo), not a generic template. If the signup flow, Firebase usage, or
 * account-deletion behavior changes, this page needs to change with it —
 * Google Play checks that the deletion flow described below actually works.
 */
export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="How we collect, use and protect your personal information."
      />

      <article className="mx-auto max-w-3xl px-4 py-10 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-3 [&_p]:text-ink-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5 [&_li]:text-ink-muted">
        <p className="text-sm text-ink-subtle">Last updated: 31 August 2026</p>

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
          <li>Your name, email address and a password, which we store only in hashed form</li>
          <li>
            Your phone number, which we verify with a one-time passcode (OTP)
            sent by SMS
          </li>
          <li>
            Your city and age, used to show relevant pricing and listings — you
            must be 18 or older to create an account
          </li>
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
          <li>To verify your phone number using an SMS one-time passcode</li>
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
          We use Google Firebase for authentication, push notifications and
          remote configuration, and Twilio to deliver the SMS one-time
          passcodes used to verify your phone number. Their handling of data is
          governed by Google&apos;s and Twilio&apos;s own privacy policies.
          Photos and files you or we upload are stored on Amazon Web Services
          (S3 and CloudFront).
        </p>

        <h2>Deleting your account</h2>
        <p>
          You can delete your account directly in the app: go to{' '}
          <strong>Settings → Delete Account</strong>. This immediately deletes
          your saved vehicles, signs you out of every device, and replaces your
          name, email and phone number with anonymized values so they can no
          longer identify you.
        </p>
        <p>
          Vehicle enquiries you have made are kept for up to 60 days from when
          you expressed interest, so a dealer can follow up, and are then
          deleted automatically — this happens whether or not your account is
          still active.
        </p>
        <p>
          You can also request deletion by emailing{' '}
          <a
            className="font-medium text-brand-700 underline"
            href="mailto:support@vgomobility.in"
          >
            support@vgomobility.in
          </a>{' '}
          from the address registered on your account, and we will action it
          the same way.
        </p>

        <h2>Security</h2>
        <p>
          Access to your account is protected by an authentication token, and
          passwords are stored only in hashed form — we cannot read them.
        </p>

        <h2>Age requirement</h2>
        <p>
          Our mobile app requires you to be 18 or older to create an account,
          and the signup flow enforces this. {SITE_NAME} is not directed at
          children, and we do not knowingly collect personal information from
          anyone under 18.
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
