import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b8324a",
        }}
      >
        <svg width="126" height="126" viewBox="0 0 40 40" fill="#f1e8de">
          <path d="M9.7 14.9C7.5 10.5 6.9 6.5 8.3 5.3c1.4-1.1 5.2 1.2 8.6 4.6z" />
          <path d="M30.3 14.9c2.2-4.4 2.8-8.4 1.4-9.6-1.4-1.1-5.2 1.2-8.6 4.6z" />
          <circle cx="20" cy="20.4" r="12.4" />
          <circle cx="13.7" cy="14.6" r="2.15" fill="#b8324a" />
          <circle cx="26.3" cy="14.6" r="2.15" fill="#b8324a" />
          <ellipse cx="20" cy="21" rx="6.4" ry="5.4" fill="#b8324a" />
          <ellipse cx="17.8" cy="21" rx="1.15" ry="1.95" fill="#f1e8de" />
          <ellipse cx="22.2" cy="21" rx="1.15" ry="1.95" fill="#f1e8de" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
