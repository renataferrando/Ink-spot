// GET /api/geocoding/reverse?lat=X&lng=Y
// Reverse geocodes coordinates to a formatted place name.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) return Response.json({ formatted: null });

  const key = process.env.OPENCAGE_API_KEY;
  if (!key) return Response.json({ formatted: null });

  try {
    const url = new URL("https://api.opencagedata.com/geocode/v1/json");
    url.searchParams.set("q", `${lat}+${lng}`);
    url.searchParams.set("key", key);
    url.searchParams.set("limit", "1");
    url.searchParams.set("no_annotations", "1");
    url.searchParams.set("language", "en");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return Response.json({ formatted: null });

    const data = (await res.json()) as { results?: { formatted: string }[] };
    const formatted = data.results?.[0]?.formatted ?? null;
    return Response.json({ formatted });
  } catch {
    return Response.json({ formatted: null });
  }
}
