import { ImageResponse } from 'next/og';

// Shared OG card for the guides segment — Next.js cascades file-convention
// metadata images down to child routes, so every /guides/* page gets this
// card unless it ships its own opengraph-image.
export const runtime = 'edge';
export const alt = 'Wedding Live Streaming Guides — WeddingLiveStreaming.com';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #faf7f2 0%, #f3ece1 55%, #e9dcc8 100%)',
          color: '#2b2620',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: '#b08d57',
            }}
          />
          <div style={{ display: 'flex', fontSize: 30, letterSpacing: 2, textTransform: 'uppercase' }}>
            WeddingLiveStreaming.com
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.1, fontWeight: 600, maxWidth: 980 }}>
            Wedding Live Streaming Guides
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: '#6b6157', maxWidth: 900 }}>
            Costs, DIY vs. professional, vetting vendors, and inviting the guests who can&rsquo;t be there.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 26, color: '#8a7d6d' }}>
          The nationwide directory of wedding livestream professionals — free for couples.
        </div>
      </div>
    ),
    size
  );
}
