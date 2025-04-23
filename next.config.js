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
  rewrites: async () => [
    {
      source: '/api/proxy/:path*',
      destination: 'http://reels-creator-alb-555953912.us-west-1.elb.amazonaws.com/api/v1/:path*',
    },
  ],
  // Add webpack configuration to properly transpile bcryptjs
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error:
      // https://github.com/vercel/next.js/issues/7755
      config.resolve.fallback = { 
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        stream: false,
        os: false 
      };
    }

    // Ensure bcryptjs is transpiled properly
    config.module.rules.push({
      test: /node_modules\/bcryptjs/,
      use: 'next-swc-loader'
    });

    return config;
  },
}

module.exports = nextConfig 