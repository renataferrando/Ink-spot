import { SearchX } from "lucide-react";

const SUGGESTIONS = [
  "blackwork",
  "fine line",
  "realism",
  "geometric",
  "watercolor",
  "traditional",
];

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <SearchX className="size-12 text-muted-foreground" aria-hidden />
      <h3 className="mt-4 font-semibold text-base">No results</h3>
      <p className="mt-2 max-w-xs text-muted-foreground text-sm">
        Try a different keyword or adjust your filters.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <span
            key={s}
            className="rounded-full border border-border px-3 py-1 text-muted-foreground text-xs"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
