import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WeddingLiveStreaming.com',
    short_name: 'WeddingLiveStreaming',
    description:
      'The nationwide directory of professional wedding live streaming vendors.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf8f4',
    theme_color: '#761e34',
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
