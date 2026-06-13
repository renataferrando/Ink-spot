// GET /api/geocoding/reverse?lat=X&lng=Y
// Reverse geocodes coordinates to a formatted place name.

import { reverseGeocode } from "@/lib/geocoding/opencage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) return Response.json({ formatted: null });

  const geo = await reverseGeocode(Number(lat), Number(lng));
  return Response.json({ formatted: geo?.formatted ?? null });
}
