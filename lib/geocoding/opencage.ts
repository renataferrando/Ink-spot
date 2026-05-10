interface GeoResult {
  lat: number;
  lng: number;
  formatted: string;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const key = process.env.OPENCAGE_API_KEY;
  if (!key) return null;

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${key}&limit=1&no_annotations=1&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: { geometry: { lat: number; lng: number }; formatted: string }[];
    };

    const result = data.results?.[0];
    if (!result) return null;

    return {
      lat: result.geometry.lat,
      lng: result.geometry.lng,
      formatted: result.formatted,
    };
  } catch {
    return null;
  }
}
