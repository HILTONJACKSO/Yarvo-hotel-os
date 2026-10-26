import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  async rewrites() {
    const apiTarget = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
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
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'kwaleebeachresort.com',
        'www.kwaleebeachresort.com',
        '82.29.175.72',
        '82.29.175.72:3000',
        ...(process.env.DOMAIN ? [
          process.env.DOMAIN,
          `www.${process.env.DOMAIN}`,
          `api.${process.env.DOMAIN}`,
        ] : []),
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'kwaleebeachresort.com' },
      { protocol: 'https', hostname: 'www.kwaleebeachresort.com' },
      { protocol: 'http',  hostname: '82.29.175.72' },
      { protocol: 'https', hostname: '82.29.175.72' },
      // Allow API subdomain (any domain set via DOMAIN env var)
      ...(process.env.DOMAIN ? [
        { protocol: 'https' as const, hostname: process.env.DOMAIN },
        { protocol: 'https' as const, hostname: `www.${process.env.DOMAIN}` },
        { protocol: 'https' as const, hostname: `api.${process.env.DOMAIN}` },
      ] : [
        { protocol: 'https' as const, hostname: '*.kwaleebeachresort.com' },
      ]),
    ]
  },
  output: 'standalone',
};

export default withSerwist(nextConfig);