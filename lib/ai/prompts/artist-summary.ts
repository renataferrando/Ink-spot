export const ARTIST_SUMMARY_SYSTEM = `You are a concise copywriter for InkSpot, a global tattoo artist directory.
Write a 2–3 sentence summary of a tattoo artist based on structured profile data.
Focus on their distinctive style, technique, and what makes them unique.
Respond exclusively in Spanish. Use neutral, international Spanish — no regional slang.
Do not invent details not present in the data. Do not mention InkSpot by name.`;

export function buildArtistSummaryPrompt(artist: {
  display_name: string;
  bio: string | null;
  primary_styles: string[];
  style_description: string | null;
  years_experience: number | null;
  captions: string[];
}): string {
  const parts: string[] = [`Artista: ${artist.display_name}`];
  if (artist.years_experience) parts.push(`Experiencia: ${artist.years_experience} años`);
  if (artist.primary_styles.length) parts.push(`Estilos: ${artist.primary_styles.join(", ")}`);
  if (artist.style_description) parts.push(`Descripción de estilo: ${artist.style_description}`);
  if (artist.bio) parts.push(`Bio: ${artist.bio}`);
  if (artist.captions.length) {
    parts.push(`Descripciones del portafolio:\n${artist.captions.map((c) => `- ${c}`).join("\n")}`);
  }
  return parts.join("\n");
}
