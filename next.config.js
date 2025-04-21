/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Other Next.js config options can go here
  images: {
    domains: ['localhost', 'reels-creator-alb-555953912.us-west-1.elb.amazonaws.com'],
  },
  // Add rewrites to proxy API requests to avoid mixed content issues
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: process.env.NEXT_PUBLIC_API_ENDPOINT.replace('/api/v1', '') + '/:path*', // Proxy to API server
      },
    ]
  },
}

module.exports = nextConfig 