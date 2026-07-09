import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#761e34',
        }}
      >
        <svg width="112" height="112" viewBox="0 0 64 64">
          <path
            d="M32 46 L14 30 C9 25 9 17 15 13 C20 9.5 26 11 29 16 L32 21 L35 16 C38 11 44 9.5 49 13 C55 17 55 25 50 30 Z"
            fill="#fbf8f4"
          />
          <path d="M28 25 L28 35 L37 30 Z" fill="#cc9433" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
