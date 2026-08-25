import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Opt into the Cache Components model: `use cache` + cacheLife, with Partial
  // Prerendering as the default. Chosen deliberately for an SEO site — every
  // route ships a static shell, and crawlers get a fully rendered document
  // rather than a streamed skeleton.
  cacheComponents: true,

  images: {
    // Vehicle images are absolute URLs served from the CloudFront distribution
    // in front of the wheely-prod-assets bucket. Add the custom domain here too
    // once assets move off the default *.cloudfront.net hostname.
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      // The dev catalog fixture (DevDataSeeder on the backend) points image
      // columns at picsum.photos so a freshly seeded database renders real
      // pictures instead of "Photo coming soon" everywhere. Development only:
      // production images come from CloudFront, and allowing an arbitrary
      // third-party host to be optimised and served under our own domain is
      // not something to ship.
      ...(process.env.NODE_ENV === 'development'
        ? [{ protocol: 'https' as const, hostname: 'picsum.photos' }]
        : []),
    ],
  },
}

export default nextConfig
