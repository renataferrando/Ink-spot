export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">{children}</main>
  );
}
