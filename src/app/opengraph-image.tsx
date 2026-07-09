import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'WeddingLiveStreaming.com — Find Wedding Live Streaming Vendors Near You';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #913049 0%, #6f2338 100%)',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 88,
            height: 88,
            borderRadius: 20,
            background: '#d49a35',
            color: '#fbfaf8',
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 36,
          }}
        >
          W
        </div>
        <div
          style={{
            display: 'flex',
            color: '#fbfaf8',
            fontSize: 64,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          WeddingLiveStreaming.com
        </div>
        <div
          style={{
            display: 'flex',
            color: '#f3e2e7',
            fontSize: 30,
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Every love story deserves every guest.
        </div>
      </div>
    ),
    { ...size }
  );
}
