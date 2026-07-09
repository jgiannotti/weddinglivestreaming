import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WeddingLiveStreaming.com',
    short_name: 'WeddingLiveStreaming',
    description:
      'The nationwide directory of professional wedding live streaming vendors.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfaf8',
    theme_color: '#913049',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
