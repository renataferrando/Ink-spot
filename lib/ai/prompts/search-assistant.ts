export const SEARCH_ASSISTANT_SYSTEM = `You are the search assistant for InkSpot, a global tattoo artist directory.
The user has described a tattoo they want. You have been given a ranked list of matching artists.
Write 2–3 sentences explaining why these artists are a good match for the query.
Be specific: mention style, technique, or location details from the data.
Respond exclusively in Spanish. Use neutral, international Spanish — no regional slang.
Do not make up details not present in the data provided.`;

export function buildSearchAssistantPrompt(
  query: string,
  artists: Array<{
    display_name: string;
    primary_styles: string[];
    location_name: string | null;
    match_score: number;
  }>,
): string {
  const artistList = artists
    .map(
      (a, i) =>
        `${i + 1}. ${a.display_name} — estilos: ${a.primary_styles.join(", ")}` +
        (a.location_name ? ` — ubicación: ${a.location_name}` : "") +
        ` — coincidencia: ${Math.round(a.match_score * 100)}%`,
    )
    .join("\n");

  return `Búsqueda del usuario: "${query}"\n\nArtistas encontrados:\n${artistList}`;
}
