import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Artist profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ handle: string }> };

export default async function ArtistOgImage({ params }: Props) {
  const { handle } = await params;

  // Attempt to fetch artist data from the API (works in edge runtime via HTTP)
  let name = "InkSpot";
  let location = "";
  let styles = "";

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/artists/${handle}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = (await res.json()) as {
        artist?: {
          display_name?: string;
          current_location?: { location_name?: string };
          primary_styles?: string[];
        };
      };
      if (json.artist) {
        name = json.artist.display_name ?? name;
        location = json.artist.current_location?.location_name ?? location;
        styles = (json.artist.primary_styles ?? []).slice(0, 3).join(" · ");
      }
    }
  } catch {
    // Fallback to defaults — OG image still renders
  }

  return new ImageResponse(
    <div
      style={{
        background: "#0a0a0a",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "64px",
        fontFamily: "sans-serif",
        gap: 12,
      }}
    >
      <div
        style={{ fontSize: 14, color: "#6b7280", letterSpacing: "3px", textTransform: "uppercase" }}
      >
        InkSpot
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, color: "#f9fafb", lineHeight: 1.1 }}>{name}</div>
      {location && <div style={{ fontSize: 22, color: "#9ca3af" }}>{location}</div>}
      {styles && <div style={{ fontSize: 18, color: "#4b5563" }}>{styles}</div>}
    </div>,
    { ...size },
  );
}
