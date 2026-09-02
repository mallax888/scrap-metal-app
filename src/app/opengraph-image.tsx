import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Litchi — Move in. Pay smarter.";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf8f4",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "#6b4635",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 40 40" fill="#f1e8de">
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
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: 8, color: "#2b211d" }}>
            LITCHI
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 700, color: "#2b211d", letterSpacing: -2 }}>
            Move in. Pay smarter.
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#857468", marginTop: 20, maxWidth: 820 }}>
            Your rental bond paid up front, repaid in fixed weekly payments.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {[
            ["Bond financed", "$2,800"],
            ["Weekly payment", "$53.85"],
            ["Interest", "0%"],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                border: "1px solid #e8ddd1",
                borderRadius: 20,
                padding: "22px 30px",
              }}
            >
              <div style={{ display: "flex", fontSize: 20, color: "#a9826a", letterSpacing: 2 }}>
                {label.toUpperCase()}
              </div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#2b211d", marginTop: 8 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
