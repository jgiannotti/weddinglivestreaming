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
          background: 'linear-gradient(135deg, #251318 0%, #3a1f27 100%)',
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
            background: '#761e34',
            marginBottom: 36,
          }}
        >
          <svg width="52" height="52" viewBox="0 0 64 64">
            <path
              d="M32 46 L14 30 C9 25 9 17 15 13 C20 9.5 26 11 29 16 L32 21 L35 16 C38 11 44 9.5 49 13 C55 17 55 25 50 30 Z"
              fill="#fbf8f4"
            />
            <path d="M28 25 L28 35 L37 30 Z" fill="#cc9433" />
          </svg>
        </div>
        <div
          style={{
            display: 'flex',
            color: '#fbf8f4',
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
            color: '#e7c7cf',
            fontSize: 30,
            marginTop: 20,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Every love story deserves every guest.
        </div>
      </div>
    ),
    { ...size }
  );
}
