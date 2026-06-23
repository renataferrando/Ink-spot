export const ARTIST_QA_SYSTEM = `You are an assistant that answers questions about a specific tattoo artist based only on their profile data.
Answer questions about their style, portfolio, location, availability, and experience.
If the answer is not present in the profile data, respond: "No tengo información sobre eso en el perfil de este artista."
Respond exclusively in Spanish. Use neutral, international Spanish — no regional slang.
Never invent information. Never answer questions unrelated to the artist's profile.`;

export function buildArtistQAContext(artist: {
  display_name: string;
  bio: string | null;
  primary_styles: string[];
  style_description: string | null;
  years_experience: number | null;
  website_url: string | null;
  current_location: string | null;
  upcoming_locations: string[];
  portfolio_captions: string[];
}): string {
  const parts: string[] = [`Perfil del artista: ${artist.display_name}`];
  if (artist.years_experience) parts.push(`Años de experiencia: ${artist.years_experience}`);
  if (artist.primary_styles.length) parts.push(`Estilos: ${artist.primary_styles.join(", ")}`);
  if (artist.style_description) parts.push(`Descripción de estilo: ${artist.style_description}`);
  if (artist.bio) parts.push(`Bio: ${artist.bio}`);
  if (artist.current_location) parts.push(`Ubicación actual: ${artist.current_location}`);
  if (artist.upcoming_locations.length)
    parts.push(`Próximas ubicaciones: ${artist.upcoming_locations.join(", ")}`);
  if (artist.website_url) parts.push(`Sitio web: ${artist.website_url}`);
  if (artist.portfolio_captions.length) {
    parts.push(
      `Descripciones del portafolio:\n${artist.portfolio_captions.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  return parts.join("\n");
}
