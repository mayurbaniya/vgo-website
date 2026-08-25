/**
 * UI copy, per language.
 *
 * Scope is the site's own chrome — nav, header controls, the sign-in dialog,
 * the footer. Catalog content (model names, spec values, offers, news) is not
 * here and cannot be: it comes from the database, which stores one language,
 * so translating it is a backend change rather than a dictionary entry.
 *
 * `en` is the source of truth. Every other dictionary is typed as
 * `Dictionary`, so adding a key here breaks the build until each language
 * supplies it — a missing translation is a compile error, never a blank label
 * discovered in production.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', htmlLang: 'en-IN' },
  { code: 'hi', label: 'हिंदी', short: 'हि', htmlLang: 'hi-IN' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

/** Name of the cookie the switcher writes. Read server-side, never in a cached scope. */
export const LANGUAGE_COOKIE = 'vgo-lang'

export function isLanguage(value: string | undefined): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value)
}

export function languageMeta(code: LanguageCode) {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0]
}

const en = {
  nav: {
    bikes: 'Bikes',
    scooters: 'Scooters',
    electric: 'Electric',
    brands: 'Brands',
    offers: 'Offers',
    news: 'News',
    primary: 'Primary',
    primaryMobile: 'Primary mobile',
  },
  header: {
    getApp: 'Get the app',
    signIn: 'Log in / Register',
    account: 'Account',
    logOut: 'Log out',
    language: 'Language',
    changeLanguage: 'Change language',
  },
  search: {
    placeholder: 'Search a model — Duke, Activa, Classic 350…',
    label: 'Search vehicles',
    submit: 'Search',
  },
  auth: {
    dialogTitle: 'Sign in to VGO',
    dialogSubtitle:
      'New here? Continuing with Google creates your account — there is nothing else to fill in.',
    continueWithGoogle: 'Continue with Google',
    working: 'Signing you in…',
    close: 'Close',
    cancelled: 'Sign-in was cancelled.',
    popupBlocked:
      'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
    unconfigured:
      'Google sign-in is not configured yet. Add the Firebase web keys to .env.local and restart the dev server.',
    failed: 'Could not sign you in. Please try again.',
    signedInAs: 'Signed in as',
  },
  bodyTypes: {
    sports: 'Sports',
    street: 'Street',
    cruiser: 'Cruiser',
    offRoad: 'Off-road',
    cafeRacer: 'Cafe racer',
    scooter: 'Scooter',
    electric: 'Electric',
  },
  /**
   * The utility strip under the primary nav, and the footer's tools column.
   * Separate from `nav` because these are things you *do* rather than parts of
   * the catalog you browse.
   */
  tools: {
    label: 'Tools',
    compare: 'Compare bikes',
    emi: 'EMI calculator',
    onRoad: 'On-road price',
    usedBikes: 'Used bikes',
    showrooms: 'Showrooms',
  },
  footer: {
    tagline:
      'Prices, specifications and dealer offers for every bike and scooter sold in India.',
    browse: 'Browse',
    byBodyType: 'By body type',
    byBudget: 'By budget',
    byEngine: 'By engine size',
    popularBrands: 'Popular brands',
    company: 'Company',
    privacyPolicy: 'Privacy policy',
    allBrands: 'All brands',
    news: 'News',
    about: 'About VGO',
    disclaimer:
      'VGO lists manufacturer specifications and indicative ex-showroom prices. On-road figures shown anywhere on this site are estimates built from published tax slabs, not dealer quotes.',
    rights: '© {year} VGO Pvt Ltd · Nagpur, Maharashtra, India',
    indicative: 'Ex-showroom prices · indicative',
  },
} as const

/**
 * The shape every language must fill.
 *
 * Derived from `en` rather than declared separately so the two cannot drift:
 * there is no way to add a key to the type without adding the English copy
 * that defines what it means.
 */
export type Dictionary = {
  [Section in keyof typeof en]: { [Key in keyof (typeof en)[Section]]: string }
}

/**
 * Hindi.
 *
 * Written to be read by someone shopping for a two-wheeler, not transliterated
 * word for word: "Get the app" becomes "ऐप डाउनलोड करें" because that is what
 * the button does. Brand-name English that Hindi speakers already use in this
 * context ("Google", "VGO", body-type names) is left in the script people
 * expect to see it in.
 *
 * NOTE: this needs a pass from a native Hindi speaker before it ships. It is
 * careful, but "careful" is not the same as "reviewed".
 */
const hi: Dictionary = {
  nav: {
    bikes: 'बाइक',
    scooters: 'स्कूटर',
    electric: 'इलेक्ट्रिक',
    brands: 'ब्रांड',
    offers: 'ऑफ़र',
    news: 'समाचार',
    primary: 'मुख्य',
    primaryMobile: 'मुख्य मोबाइल',
  },
  header: {
    getApp: 'ऐप डाउनलोड करें',
    signIn: 'लॉग इन / रजिस्टर',
    account: 'खाता',
    logOut: 'लॉग आउट',
    language: 'भाषा',
    changeLanguage: 'भाषा बदलें',
  },
  search: {
    placeholder: 'मॉडल खोजें — Duke, Activa, Classic 350…',
    label: 'वाहन खोजें',
    submit: 'खोजें',
  },
  auth: {
    dialogTitle: 'VGO में साइन इन करें',
    dialogSubtitle:
      'पहली बार आए हैं? Google से जारी रखने पर आपका खाता अपने आप बन जाएगा — और कुछ भरने की ज़रूरत नहीं।',
    continueWithGoogle: 'Google से जारी रखें',
    working: 'साइन इन किया जा रहा है…',
    close: 'बंद करें',
    cancelled: 'साइन इन रद्द कर दिया गया।',
    popupBlocked:
      'आपके ब्राउज़र ने Google विंडो रोक दी। इस साइट के लिए पॉप-अप की अनुमति दें और फिर कोशिश करें।',
    unconfigured:
      'Google साइन इन अभी कॉन्फ़िगर नहीं हुआ है। .env.local में Firebase वेब कुंजियाँ जोड़ें और डेव सर्वर फिर से चालू करें।',
    failed: 'साइन इन नहीं हो सका। कृपया फिर से कोशिश करें।',
    signedInAs: 'साइन इन:',
  },
  bodyTypes: {
    sports: 'स्पोर्ट्स',
    street: 'स्ट्रीट',
    cruiser: 'क्रूज़र',
    offRoad: 'ऑफ़-रोड',
    cafeRacer: 'कैफ़े रेसर',
    scooter: 'स्कूटर',
    electric: 'इलेक्ट्रिक',
  },
  tools: {
    label: 'टूल्स',
    compare: 'बाइक तुलना',
    emi: 'EMI कैलकुलेटर',
    onRoad: 'ऑन-रोड कीमत',
    usedBikes: 'पुरानी बाइक',
    showrooms: 'शोरूम',
  },
  footer: {
    tagline:
      'भारत में बिकने वाली हर बाइक और स्कूटर की कीमत, स्पेसिफ़िकेशन और डीलर ऑफ़र।',
    browse: 'ब्राउज़ करें',
    byBodyType: 'बॉडी टाइप अनुसार',
    byBudget: 'बजट अनुसार',
    byEngine: 'इंजन साइज़ अनुसार',
    popularBrands: 'लोकप्रिय ब्रांड',
    company: 'कंपनी',
    privacyPolicy: 'गोपनीयता नीति',
    allBrands: 'सभी ब्रांड',
    news: 'समाचार',
    about: 'VGO के बारे में',
    disclaimer:
      'VGO निर्माता द्वारा दिए गए स्पेसिफ़िकेशन और अनुमानित एक्स-शोरूम कीमतें दिखाता है। इस साइट पर दिखाई गई ऑन-रोड कीमतें प्रकाशित टैक्स स्लैब से निकाला गया अनुमान हैं, डीलर का कोटेशन नहीं।',
    rights: '© {year} VGO Pvt Ltd · नागपुर, महाराष्ट्र, भारत',
    indicative: 'एक्स-शोरूम कीमतें · अनुमानित',
  },
}

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, hi }

/**
 * Synchronous on purpose.
 *
 * Both dictionaries are small enough that splitting them into dynamic imports
 * would trade a few kilobytes for a loading state in the header on every
 * language change. Revisit if the dictionary grows past the chrome.
 */
export function getDictionary(language: LanguageCode): Dictionary {
  return DICTIONARIES[language] ?? DICTIONARIES[DEFAULT_LANGUAGE]
}

/** Fills `{name}` placeholders. Keeps the copy in the dictionary, not in JSX. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}
