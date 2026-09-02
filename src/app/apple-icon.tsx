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
          background: "#6b4635",
        }}
      >
        <svg width="118" height="118" viewBox="0 0 40 40" fill="#f1e8de">
          <path d="M11.8 13.4 13.7 6.3a1.4 1.4 0 0 1 2.2-.7l4.7 4.6z" />
          <rect x="5" y="11" width="26" height="19" rx="9.5" />
          <rect x="25" y="15.5" width="10" height="9" rx="4.5" />
          <rect x="10" y="27" width="4.6" height="6.4" rx="2.3" />
          <rect x="21.4" y="27" width="4.6" height="6.4" rx="2.3" />
          <rect x="11.6" y="14.4" width="3.6" height="10.6" rx="1.8" fill="#6b4635" />
          <rect x="11.6" y="21.4" width="9.2" height="3.6" rx="1.8" fill="#6b4635" />
          <circle cx="23.6" cy="16.8" r="1.25" fill="#6b4635" />
          <circle cx="32.4" cy="20" r="1.15" fill="#6b4635" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
