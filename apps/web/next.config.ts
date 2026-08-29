import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // API URL for server-side requests (internal network)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  // Strict mode for better development warnings
  reactStrictMode: true,
  // Experimental features
  experimental: {
    // Enable server actions (needed for form handling)
    serverActions: {
      allowedOrigins: ['localhost:3000', 'kwaleebeachresort.com', 'www.kwaleebeachresort.com'],
    },
  },
  output: 'standalone',
};

export default nextConfig;

