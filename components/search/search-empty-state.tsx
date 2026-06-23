import { SearchX } from "lucide-react";

const SUGGESTIONS = ["blackwork", "fine line", "realism", "geometric", "watercolor", "traditional"];

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <SearchX className="text-muted-foreground size-12" aria-hidden />
      <h3 className="mt-4 text-base font-semibold">No results</h3>
      <p className="text-muted-foreground mt-2 max-w-xs text-sm">
        Try a different keyword or adjust your filters.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <span
            key={s}
            className="border-border text-muted-foreground rounded-full border px-3 py-1 text-xs"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
