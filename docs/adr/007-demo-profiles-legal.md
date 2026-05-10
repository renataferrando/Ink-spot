# ADR 007 — Demo Profile Strategy (Unsplash License + Ley 8968 CR)

**Status:** Accepted  
**Date:** 2025-01-01

## Context

InkSpot launches with 20 demo profiles to show the product to potential artist customers before any real artists have claimed profiles. These profiles need realistic-looking content (location, styles, portfolio images) to be convincing, but must not create legal liability.

Two legal constraints apply:

1. **Unsplash License** prohibits using Unsplash photos to represent a specific person in a way that implies they endorse or are associated with the product. Using an Unsplash portrait photo and labeling it "Maria González, tattoo artist in Santa Teresa" would violate this.

2. **Ley 8968 — Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Costa Rica)** prohibits processing personal data in a deceptive manner. Creating a profile that implies a real person has a tattoo studio at specific real-world coordinates — when they don't — could constitute deceptive data processing and expose InkSpot to a PRODHAB complaint.

## Decision

Demo profiles must meet all of the following constraints:

**Names:** Obviously fictional. Formats like "Demo Studio 1", "Estudio de Prueba Norte", "Estudio del Pacífico Demo". Never a realistic human name (e.g., "Daniela Vargas") combined with real coordinates.

**Profile images (avatar):**
- First choice: AI-generated stylized avatar (Stable Diffusion / DALL·E with a prompt like "stylized illustrated tattoo artist avatar, non-photorealistic"). Clear that it is not a photograph.
- Second choice: Initials on a solid color background (`DM`, `EP`, etc.).
- Not allowed: Real portrait photographs from Unsplash or any other source.

**Portfolio images:** Photos of tattoo *artwork* (not of any identifiable person) sourced from:
- Unsplash (permissible for portfolio work images, not for portrait attribution)
- AI-generated tattoo artwork
- Public domain sources

All Unsplash photos must be attributed in the app footer: "Photos from Unsplash."

**Coordinates:** Real coordinates are acceptable (Santa Teresa, Puntarenas area) since the studio name is clearly fictional. The combination of a real human name + real coordinates is what creates legal risk, not coordinates alone.

**Indexing:** Demo profiles (`is_demo = TRUE AND is_claimed = FALSE`) always emit `<meta name="robots" content="noindex,nofollow">` and are excluded from `sitemap.ts`. This prevents Google from indexing fictional content as real business listings.

**Disclaimer:** Every demo profile displays: *"Este es un perfil de demostración creado para mostrar las funcionalidades de InkSpot. Ningún perfil de demostración representa a ningún artista real."* App footer repeats this disclaimer.

## Consequences

- Slightly less visually compelling demo profiles (no portrait photos), but this is an acceptable tradeoff.
- The `DemoBadge` component and the disclaimer banner make the fictional status unambiguous to any user.
- The `noindex` + sitemap exclusion policy ensures no Google penalty and no consumer confusion from organic search.
- When a real artist claims a demo profile, `is_claimed = TRUE` flips, the badge disappears, and Google can index it.
