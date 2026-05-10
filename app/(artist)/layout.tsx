export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Public artist profiles ship with a full-bleed cover and floating
  // Back/Share controls (see ArtistProfile + globals.css `.cover`).
  // No global header — the page governs the top of the screen.
  return <main className="min-h-screen">{children}</main>;
}
