interface IgPreviewCardProps {
  handle: string;
  verified?: boolean;
}

export function IgPreviewCard({ handle, verified = false }: IgPreviewCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: 12,
      }}
    >
      {/* @ avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "999px",
          background: "var(--surface-3)",
          border: "1px solid var(--hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono, ui-monospace)",
          fontSize: 13,
          color: "var(--text-2)",
          flexShrink: 0,
        }}
      >
        @
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-mono, ui-monospace)",
            fontSize: 14,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {handle}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--dim)",
            marginTop: 2,
          }}
        >
          Public Instagram profile
        </div>
      </div>

      {/* Verified badge */}
      {verified && (
        <div
          style={{
            fontFamily: "var(--font-mono, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent)",
            flexShrink: 0,
          }}
        >
          Verified
        </div>
      )}
    </div>
  );
}
