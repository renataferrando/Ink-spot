# InkSpot — Design conventions

This document captures the **meaning** of the design system. Values live in
`app/globals.css` (the `:root` block and the `@theme inline` block). This file
exists so a token's intent survives even when the codebase grows.

Scope: dark-mode-only "Dark Studio" aesthetic, accent `#6467f2`, fonts Geist
(sans) + JetBrains Mono. No light theme is planned.

---

## 1. Token semantics

### Greys (text)

| Token        | Tailwind class         | Use for                                                                                          | Don't use for                |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| `--text`     | `text-(--text)`        | Primary copy, display names, headings, the value you actually want read                          | Metadata, captions, eyebrows |
| `--text-2`   | `text-text-2`          | Secondary copy: bios, meta rows on cards, location names, supporting paragraphs                  | Section eyebrows, handles    |
| `--dim`      | `text-dim` / `.dim`    | Mono metadata: handles (`@bones`), distances, dates, "yrs", section eyebrows (10–11px uppercase) | Body prose                   |
| `--faint`    | `text-faint` / `.faint`| Tiny labels ("NOW"/"NEXT" 9px), separator dots (`·`), URL footer, deeply de-emphasized hints     | Anything you need to read    |
| `--ink`      | —                      | On-accent text only (rarely needed; `--accent-ink` is preferred)                                 | Anything else                |

### Surfaces (backgrounds)

| Token         | Tailwind class      | Use for                                                                                  | Don't use for             |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------- | ------------------------- |
| `--bg`        | (page body)         | The page background. Always black; set globally in `globals.css`.                        | Cards, interactive things |
| `--surface`   | `bg-surface`        | Primary card / row background (`ArtistCard`, location bar, account cards, Q&A panel)     | Inputs, hover states      |
| `--surface-2` | `bg-surface-2`      | Inputs, chips, hover/active states on cards, secondary buttons, empty portfolio tiles    | Primary cards             |
| `--surface-3` | `bg-surface-3`      | Deeper recess: avatar placeholders, progress-bar tracks, hover-on-hover (e.g. icon btns) | Anything top-level        |

### Borders

| Token         | Tailwind class    | Use for                                                                  |
| ------------- | ----------------- | ------------------------------------------------------------------------ |
| `--hairline`  | `border-hairline` | 1px dividers, card outlines, scrollbar thumb, dashed empty-state borders |
| `--border-ds` | `border-ds-border`| Slightly heavier borders: inputs, secondary buttons, save heart button   |

### Accent (`#6467f2`)

| Token            | Tailwind class      | Use for                                                                                       |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `--accent`       | `text-ink-spot` / `bg-ink-spot` / `border-ink-spot` | Primary interactive: CTAs, "now" dot, active chip, accent `<em>` on display names, AI labels |
| `--accent-soft`  | `bg-accent-soft`    | Backgrounds for AI/match badges, active-mode tab fill, focus rings (`0 0 0 3px var(--accent-soft)`) |
| `--accent-glow`  | (inline `box-shadow`) | Soft glow on dots and progress bars: `shadow-[0_0_8px_var(--accent-glow)]`                  |
| `--accent-ink`   | `text-(--accent-ink)` | Text **on** an accent fill (e.g. `.btn-primary` label)                                      |

Rule: **one** accent action per visible region. If two things are accent, one is wrong.

### Semantic badges

| Token              | Tailwind class    | Use for                                                                 |
| ------------------ | ----------------- | ----------------------------------------------------------------------- |
| `--color-match`    | `text-match`      | Match-percentage labels (sky `#38bdf8`), `.badge-match` class           |
| `--color-demo`     | `text-demo`       | Demo banner pill on demo profiles (`is_demo === true`), `.demo-banner`  |

Never use sky or amber for anything other than these two badges.

---

## 2. Two-layer styling rule

**Tailwind classes first.** When styling a component, reach for Tailwind utilities
(`flex`, `gap-3`, `text-dim`, `bg-surface`, etc.) before adding or extending CSS in
`globals.css`. Named classes are the exception, not the default.

**No React `style` prop for static styling.** Put styles on `className` (Tailwind or a named
class), not `style={{ ... }}`. "Inline" in this doc means utilities on the JSX element via
`className` — not inline CSS objects.

Exceptions (only when Tailwind or a named class can't apply):

- **Dynamic runtime values** — e.g. `style={{ width: \`${pct}%\` }}` on a progress bar.
- **APIs that require style objects** — e.g. `ImageResponse` / `opengraph-image.tsx`.

The codebase mixes two layers on purpose. Stay on the right one:

- **Tailwind utilities on `className`** — default for layout, spacing, typography, colors, and
  one-off composition on a single component.
- **Named class in `globals.css`** when:
  - The pattern repeats in 2+ components, **and**
  - It carries bespoke geometry the token system alone can't express (multi-line gradients,
    pseudo-elements, scoped overrides).
  - Examples in use: `.chip` (+ `.active`), `.btn-primary`, `.btn-secondary`, `.tab-shell`,
    `.section-head` (+ `.title`, `.count`, `.meta`), `.filter-bar`, `.label`, `.dim`, `.faint`,
    `.badge-ai`, `.badge-match`, `.demo-banner`, `.code-box`, `.steps`.

Three follow-on rules:

1. **Never re-declare a named class's properties via `cn()`.** If you need to tweak it, scope
   it from a parent (the precedent is `.cta-row .btn-primary { flex: 1 }` in Stage 3.7). The
   current `btn-primary w-auto! min-w-0 flex-1` in `artist-profile.tsx` is a deliberate Tailwind
   override using `!` — keep that escape hatch rare.
2. **Don't extract a class until the second consumer arrives.** The Q&A panel chrome in
   `components/artist/artist-profile.tsx` is one such candidate; it lives inline today and stays
   inline until a second screen needs it.
3. **shadcn primitives stay in `components/ui/`** untouched. If you need a "design-system"
   button (`.btn-primary`), use the named class; if you need a generic shadcn button, use
   `<Button />`. They are not the same thing.

---

## 3. Typography

### Font assignment

- **`var(--font-sans)` (Geist)** — all prose, names, bios, headings, display copy, paragraph body.
- **`var(--font-mono)` (JetBrains Mono)** — **only** metadata and labels:
  - Handles (`@bones`)
  - Dates, date ranges, distances (`1.2 km`, `Nov 12`)
  - "yrs", "%", numeric meta
  - Section eyebrows ("PORTFOLIO · 12", "NOW", "NEXT", "MATCH")
  - Button labels inside `.btn-primary` / `.btn-secondary` (uppercase, tracked)
  - Badge text (AI, MATCH, DEMO)
  - Footer URL line

If you're typing English prose, it's sans. If you're typing a label or a number, it's mono.

### Eyebrow pattern (the 10px uppercase label)

There are two canonical sizes — pick by context:

- **Section eyebrow (10–11px)** — `text-dim font-mono text-[10px] tracking-[0.14em] uppercase`
  Used for "PORTFOLIO · 12", "MATCH", "STYLE BRIEF". Reach for the `.label` class when you can.
- **Micro eyebrow (9px)** — `text-faint font-mono text-[9px] tracking-[0.14em] uppercase`
  Used inside the location bar ("NOW", "NEXT"), under the match score ("MATCH"), URL footer.

### Display-name accent (`<em>`)

When a heading is a person's name with two or more words, the **second word** gets the accent:

```tsx
<h1>
  {first}{" "}
  <em className="text-ink-spot not-italic">{rest}</em>
</h1>
```

Same convention is used for marketing-style headings ("What are you _imagining_?", "Are you
the _artist?_", "Within _50&nbsp;km_"). Reserve this treatment for **one** word per heading.

### Sizes in use (informational, not prescriptive)

The codebase has settled on a small set of sizes. Stay near them:

- Display name on `/artist/{handle}`: **44px**, `tracking-[-0.02em]`, `leading-[0.95]`, weight 500
- Section title on `/explore`: `clamp(26px, 2.6vw, 34px)`
- Body / bio: **18px**, `leading-normal`
- Secondary copy on cards: **12–13px**
- Mono eyebrow: **9–11px** with `tracking-[0.12em–0.16em]`

---

## 4. Iconography & motion

- **Icons**: `lucide-react` only. Render at the surrounding text size (`size={14}` for inline
  button icons, `size={18}` for icon-only buttons). Decorative icons get `aria-hidden`.
- **"Now" dot**: 6px accent circle with glow:
  `bg-ink-spot ... rounded-full shadow-[0_0_8px_var(--accent-glow)]`. Always accent, never green.
- **Standard easing**: `--e-out` = `cubic-bezier(0.2, 0.7, 0.2, 1)`. Use it for any animation
  longer than a hover (`ease-(--e-out)`). Hovers can use the default.
- **Film grain overlay**: applied globally in `globals.css` via `body::after`. Don't replicate it.

---

## 5. What's intentionally out of scope

- **Light mode** — not planned. Don't introduce `.dark` scoping or `prefers-color-scheme` branches.
- **A component catalog with prop tables** — premature; the surface is small and components are
  documented well enough by reading them. Revisit when a second consumer appears for any bespoke
  chrome (Q&A panel, style-brief block, location bar).
- **A spacing/radius scale** — the tokens (`--r-sm` through `--r-xl`) plus Tailwind's default
  spacing scale are sufficient. We do not need a custom 4-step spacing token system.

### Page width (all views)

Every screen shares the same column: **`--page-max` (960px)** and **`--page-gutter` (18px)**.
Use the `.page-column` and `.page-gutter` classes (or the `PageColumn` component). Tab routes
wrap that in `.tab-shell` for the desktop card frame and bottom-nav clearance.

---

## 6. Where to look first

- Token values: `app/globals.css` (`:root` + `@theme inline`)
- Reference card layouts: `components/artist/artist-card.tsx`, `components/artist/artist-row-desktop.tsx`
- Reference page chrome: `components/artist/artist-profile.tsx`, `app/(app)/explore/page.tsx`
- Page width (all views): `.page-column` + `.page-gutter` in `app/globals.css` (`--page-max` 960px, `--page-gutter` 18px); tab routes also use `.tab-shell`
- Form/CTA examples: `.btn-primary` consumers across `app/(auth)/`
