import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kwalee Hotel Management System',
    short_name: 'Kwalee HMS',
    description: 'Production-grade Property Management System for Kwalee Hotel',
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
