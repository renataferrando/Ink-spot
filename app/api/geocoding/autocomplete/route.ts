// GET /api/geocoding/autocomplete?q=<text>
// Returns up to 5 place candidates with formatted name + coordinates.
// Biased toward Costa Rica. Cached at the edge for 60 s.

export const revalidate = 60;

interface Candidate {
  id: string;
  formatted: string;
  lat: number;
  lng: number;
  country: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json({ candidates: [] });

  const key = process.env.OPENCAGE_API_KEY;
  if (!key) return Response.json({ candidates: [] });

  try {
    const url = new URL("https://api.opencagedata.com/geocode/v1/json");
    url.searchParams.set("q", q);
    url.searchParams.set("key", key);
    url.searchParams.set("limit", "5");
    url.searchParams.set("no_annotations", "1");
    url.searchParams.set("language", "en");
    // Bias toward Costa Rica but don't hard-restrict so traveling artists can add other cities
    url.searchParams.set("countrycode", "cr");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return Response.json({ candidates: [] });

    const data = (await res.json()) as {
      results?: {
        formatted: string;
        geometry: { lat: number; lng: number };
        components: { country?: string };
      }[];
    };

    const candidates: Candidate[] = (data.results ?? []).map((r, i) => ({
      id: `${i}-${r.geometry.lat}-${r.geometry.lng}`,
      formatted: r.formatted,
      lat: r.geometry.lat,
      lng: r.geometry.lng,
      country: r.components.country ?? "",
    }));

    return Response.json({ candidates });
  } catch {
    return Response.json({ candidates: [] });
  }
}
