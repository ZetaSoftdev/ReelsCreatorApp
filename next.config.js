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
  
  // Only use bcryptjs as server-only package
  serverExternalPackages: ['bcryptjs'],
  
  // Configure experimental features
  experimental: {
    // Correctly handle package modifiers
    optimizePackageImports: ['@prisma/client'],
    // Skip collection for problematic routes
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
  },
  
  // Configure webpack to handle Node.js modules in browser
  webpack: (config, { isServer }) => {
    // Handle Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Special handling for Prisma in server builds
    if (isServer) {
      // Prevent bundling of Prisma
      config.externals = [...(config.externals || []), '@prisma/client', 'prisma'];
    }
    
    return config;
  },

  // Set environment variables for Railway deployment
  env: {
    PRISMA_FORCE_NODE: process.env.RAILWAY === "true" ? "true" : undefined,
  }
}

module.exports = nextConfig 