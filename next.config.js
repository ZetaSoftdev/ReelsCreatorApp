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
    domains: ['localhost'],
  },
  // Add special options for Railway deployment
  output: process.env.RAILWAY === "true" ? "standalone" : undefined,
  // Skip static optimization during build to avoid the URL issues
  experimental: {
    // Enable this only for Railway builds
    ...(process.env.RAILWAY === "true" ? {
      skipTrailingSlashRedirect: true,
      skipMiddlewareUrlNormalize: true,
      // Disable server static generation
      disableOptimizedLoading: true
    } : {})
  }
}

module.exports = nextConfig 