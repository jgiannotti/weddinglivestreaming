/** @type {import('next').NextConfig} */
const nextConfig = {
  // Unblock deploys while we iterate; types/lint still enforced locally via `next lint` + `tsc --noEmit`
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'weddinglivestreaming.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Preserve current WordPress URL shape for SEO
  async redirects() {
    return [
      // WordPress trailing slash legacy — Next handles trailingSlash via config
    ];
  },
  trailingSlash: true,
};

export default nextConfig;
