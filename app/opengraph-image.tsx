import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InkSpot — Tattoo artists in Santa Teresa, Costa Rica";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#0a0a0a",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: "#f9fafb",
          letterSpacing: "-2px",
        }}
      >
        InkSpot
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#6b7280",
        }}
      >
        Tattoo artists in Santa Teresa, Costa Rica
      </div>
    </div>,
    { ...size },
  );
}
