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
              <path d="M9.7 14.9C7.5 10.5 6.9 6.5 8.3 5.3c1.4-1.1 5.2 1.2 8.6 4.6z" />
              <path d="M30.3 14.9c2.2-4.4 2.8-8.4 1.4-9.6-1.4-1.1-5.2 1.2-8.6 4.6z" />
              <circle cx="20" cy="20.4" r="12.4" />
              <circle cx="13.7" cy="14.6" r="2.15" fill="#6b4635" />
              <circle cx="26.3" cy="14.6" r="2.15" fill="#6b4635" />
              <ellipse cx="20" cy="21" rx="6.4" ry="5.4" fill="#6b4635" />
              <ellipse cx="17.8" cy="21" rx="1.15" ry="1.95" fill="#f1e8de" />
              <ellipse cx="22.2" cy="21" rx="1.15" ry="1.95" fill="#f1e8de" />
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
