<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design conventions

Before writing or modifying UI, read [`docs/design.md`](docs/design.md). It documents
token semantics (greys, surfaces, accent), the two-layer styling rule (Tailwind
`className` first, named classes in `app/globals.css` when a pattern repeats), and
typography conventions (mono/sans split, eyebrow pattern, display-name `<em>` accent).

Do **not** use the React `style` prop for static styling — use Tailwind or a named class.
Only exceptions: dynamic runtime values (e.g. percent widths) and APIs that require style
objects (OG images).
