interface MatchScoreProps {
  score?: number;
}

export function MatchScore({ score }: MatchScoreProps) {
  if (score == null) return null;

  const pct = Math.round(score * 100);

  return (
    <span
      className="rounded-full bg-[#1f2e1f] px-2 py-0.5 text-xs font-medium text-[#7fb87f]"
      aria-label={`${pct}% match`}
    >
      {pct}% match
    </span>
  );
}
