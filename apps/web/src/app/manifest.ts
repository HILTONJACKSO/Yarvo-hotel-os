import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kwalee Beach Resort',
    short_name: 'Kwalee Resort',
    description: 'Kwalee Beach Resort — Luxury Coastal Resort & Management Portal in Liberia',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D1714',
    theme_color: '#F5B041',
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
