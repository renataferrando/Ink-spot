import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";

interface AISummarySectionProps {
  artistId: string;
  styleBreakdown: Array<[string, number]> | null;
}

export async function AISummarySection({ artistId, styleBreakdown }: AISummarySectionProps) {
  let summary: string | null = null;

  try {
    const admin = getSupabaseAdminClientUntyped();
    const now = new Date().toISOString();
    const { data } = await admin
      .from("ai_artist_summaries")
      .select("content")
      .eq("artist_id", artistId)
      .gt("expires_at", now)
      .single();

    summary = data?.content ?? null;
  } catch {
    // Graceful fallback — section simply doesn't render
  }

  if (!summary && !styleBreakdown) return null;

  return (
    <div className="border-hairline mt-8 border-t px-[18px] pt-7 pb-6">
      <div className="mb-3.5 flex items-baseline justify-between">
        <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">
          Style brief
        </div>
        <div className="text-ink-spot before:bg-ink-spot inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] uppercase before:size-1 before:rounded-full before:content-['']">
          AI · Auto-generated
        </div>
      </div>
      {summary && (
        <p className="text-[19px] leading-[1.45] text-pretty text-(--text)">{summary}</p>
      )}
      {styleBreakdown && (
        <>
          <div className="h-[18px]" />
          <div className="flex flex-col gap-2.5">
            {styleBreakdown.map(([name, pct]) => (
              <div className="flex items-center gap-2.5 font-mono text-[11px]" key={name}>
                <div className="text-text-2 w-20 tracking-[0.06em] uppercase">{name}</div>
                <div className="bg-surface-3 h-1 flex-1 overflow-hidden rounded-[2px]">
                  <div
                    className="bg-ink-spot h-full shadow-[0_0_8px_var(--accent-glow)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-dim w-8 text-right text-[10px]">{pct}%</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
