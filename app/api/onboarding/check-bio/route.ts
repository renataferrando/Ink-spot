// Fetches the public Instagram profile page and checks for the verification code
// in the og:description meta tag. Returns { verified: boolean }.
// Falls back to { verified: false } on any fetch/parse error.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle");
  const code = searchParams.get("code");

  if (!handle || !code) {
    return Response.json({ verified: false, error: "Missing parameters" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InkSpot/1.0; +https://inkspot.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json({ verified: false });
    }

    const html = await res.text();

    // Look for the code anywhere in the page (bio appears in og:description + script tags)
    const verified = html.includes(code);

    return Response.json({ verified });
  } catch {
    // Network error, timeout, or Instagram blocked — fall back gracefully
    return Response.json({ verified: false });
  }
}
