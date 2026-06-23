export function isInstagramCdnUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname.endsWith(".cdninstagram.com") || hostname.endsWith(".fbcdn.net"))
    );
  } catch {
    return false;
  }
}
