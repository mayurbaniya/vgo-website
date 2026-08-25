'use client'

/**
 * Google sign-in, via the Firebase Web SDK.
 *
 * The backend verifies the credential with `FirebaseAuth.verifyIdToken`, so it
 * has to be a *Firebase* ID token — a raw Google Identity Services credential
 * would not validate. That is why this goes through Firebase Auth rather than
 * talking to Google directly.
 *
 * Every SDK import is dynamic, inside `signInWithGoogle`. Firebase Auth is a
 * few hundred kilobytes and this is an SEO site: a static import would put it
 * in the shared chunk, on the critical path of every page a crawler fetches,
 * to serve a button most visitors never press. Nothing loads until someone
 * actually clicks.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * Whether a Firebase Web app has been registered for this project yet.
 *
 * The Flutter app's `firebase_options.dart` carries android and ios entries
 * only, so `vehicle-8726b` has no Web app and therefore no web apiKey/appId to
 * put in the env. Until someone adds one in the Firebase console, the dialog
 * says so plainly instead of throwing an SDK error at the reader.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

export type GoogleCredential = {
  idToken: string
  email: string
  name: string | null
}

/** The two outcomes the dialog has specific copy for. */
export class SignInCancelled extends Error {}
export class PopupBlocked extends Error {}

/**
 * Opens the Google account chooser and returns a credential the backend can
 * verify.
 *
 * The email travels alongside the token because
 * `/user/auth/google-sign-in` validates `data.get("email")` in the controller,
 * before the service ever decodes the token — omit it and the request comes
 * back as an invalid email address rather than as a bad token.
 */
export async function signInWithGoogle(): Promise<GoogleCredential> {
  const [{ initializeApp, getApps }, { GoogleAuthProvider, getAuth, signInWithPopup }] =
    await Promise.all([import('firebase/app'), import('firebase/auth')])

  const app = getApps()[0] ?? initializeApp(config as Record<string, string>)
  const auth = getAuth(app)

  const provider = new GoogleAuthProvider()
  // Always show the chooser. Silently reusing whichever Google session the
  // browser already holds is surprising on a shared machine.
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const result = await signInWithPopup(auth, provider)
    const idToken = await result.user.getIdToken()
    const email = result.user.email

    if (!email) {
      throw new Error('Google account has no email address')
    }

    return { idToken, email, name: result.user.displayName }
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      throw new SignInCancelled()
    }
    if (code === 'auth/popup-blocked') {
      throw new PopupBlocked()
    }
    throw error
  }
}
