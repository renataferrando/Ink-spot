import { cityCountryFromComponents } from "@/lib/location";

interface GeoResult {
  lat: number;
  lng: number;
  formatted: string;
}

type OpenCageResult = {
  geometry: { lat: number; lng: number };
  formatted: string;
  components: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    country?: string;
  };
};

function toGeoResult(result: OpenCageResult): GeoResult {
  return {
    lat: result.geometry.lat,
    lng: result.geometry.lng,
    formatted: cityCountryFromComponents(result.components, result.formatted),
  };
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const key = process.env.OPENCAGE_API_KEY;
  if (!key) return null;

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${key}&limit=1&no_annotations=1&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: OpenCageResult[] };
    const result = data.results?.[0];
    if (!result) return null;

    return toGeoResult(result);
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  const key = process.env.OPENCAGE_API_KEY;
  if (!key) return null;

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${key}&limit=1&no_annotations=1&language=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: OpenCageResult[] };
    const result = data.results?.[0];
    if (!result) return null;

    return toGeoResult(result);
  } catch {
    return null;
  }
}
