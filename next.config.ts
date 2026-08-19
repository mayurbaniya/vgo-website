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
    ],
  },
}

export default nextConfig
