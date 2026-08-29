import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yarvo Hotel Management System',
    short_name: 'Yarvo HMS',
    description: 'Production-grade Property Management System for Yarvo Hotel',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#060B14',
    theme_color: '#FFB800',
    icons: [
      {
        src: '/icon-512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icon-512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
