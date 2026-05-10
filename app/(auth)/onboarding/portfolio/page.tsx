"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2 } from "lucide-react";
import Image from "next/image";

import { addPortfolioItem } from "@/actions/artist/add-portfolio-item";

const MAX_IMAGES = 30;
const MAX_MB = 5;

interface UploadedItem {
  url: string;
  name: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [items, setItems]         = useState<UploadedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (items.length >= MAX_IMAGES) return;
    setError(null);

    const toUpload = Array.from(files).slice(0, MAX_IMAGES - items.length);

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); continue; }
      if (file.size > MAX_MB * 1024 * 1024) { setError(`${file.name} exceeds 5 MB.`); continue; }

      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };

      if (json.error) { setError(json.error); setUploading(false); continue; }
      if (json.url) {
        const dbResult = await addPortfolioItem(json.url, file.name.replace(/\.[^.]+$/, ""));
        if (dbResult.error) {
          setError(dbResult.error);
          setUploading(false);
          continue;
        }
        setItems((prev) => [...prev, { url: json.url!, name: file.name }]);
      }
      setUploading(false);
    }
  }, [items]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Heading */}
      <div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            margin: "0 0 8px",
          }}
        >
          Upload your{" "}
          <span style={{ color: "var(--accent)" }}>portfolio</span>.
        </h1>
        <p style={{ fontSize: 14, color: "var(--dim)", margin: 0, lineHeight: 1.55 }}>
          Add your best work — up to {MAX_IMAGES} photos, {MAX_MB}&nbsp;MB each.
        </p>
      </div>

      {/* Drop zone */}
      <label
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "var(--surface)",
          border: `1.5px dashed ${dragOver ? "var(--accent)" : "var(--hairline)"}`,
          borderRadius: "var(--r-lg)",
          padding: "36px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <Upload size={28} style={{ color: "var(--dim)" }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", margin: "0 0 4px" }}>
            Drag photos here or click to select
          </p>
          <span className="label">{items.length}/{MAX_IMAGES} uploaded</span>
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading || items.length >= MAX_IMAGES}
        />
      </label>

      {error && (
        <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
      )}
      {uploading && (
        <p className="label" style={{ textAlign: "center" }}>Uploading…</p>
      )}

      {/* Thumbnails */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                aspectRatio: "1",
                overflow: "hidden",
                borderRadius: "var(--r-sm)",
                background: "var(--surface-2)",
              }}
            >
              <Image src={item.url} alt={item.name} fill sizes="120px" style={{ objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        className="btn-primary"
        onClick={() => router.push("/onboarding/avatar")}
        disabled={uploading}
      >
        {items.length > 0 ? (
          <><CheckCircle2 size={14} /> Continue</>
        ) : (
          "Skip for now"
        )}
      </button>
    </div>
  );
}
