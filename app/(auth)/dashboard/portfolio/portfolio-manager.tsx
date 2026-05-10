"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addPortfolioItem, removePortfolioItem } from "@/actions/artist/add-portfolio-item";

interface Item { id: string; image_url: string; alt_text?: string | null; is_featured: boolean }

export function PortfolioManager({ initialItems }: { initialItems: Item[] }) {
  const [items,    setItems]    = useState<Item[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (items.length >= 30) return;
    setError(null);
    for (const file of Array.from(files).slice(0, 30 - items.length)) {
      if (!file.type.startsWith("image/")) { setError("Images only."); continue; }
      if (file.size > 5 * 1024 * 1024) { setError(`${file.name} is over 5 MB.`); continue; }
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (json.error) { setError(json.error); } else if (json.url) {
        const dbResult = await addPortfolioItem(json.url);
        if (dbResult.error) { setError(dbResult.error); } else {
          setItems((p) => [...p, { id: crypto.randomUUID(), image_url: json.url!, is_featured: p.length === 0, alt_text: null }]);
        }
      }
      setUploading(false);
    }
  }, [items]);

  async function handleRemove(id: string) {
    await removePortfolioItem(id);
    setItems((p) => p.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      <label
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card py-6 hover:border-primary/40 transition-colors"
      >
        <Upload className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Add photos ({items.length}/30)</span>
        <input type="file" accept="image/*" multiple className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading || items.length >= 30} />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}

      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
            <Image src={item.image_url} alt={item.alt_text ?? "Portfolio"} fill sizes="120px" className="object-cover" />
            <button type="button" onClick={() => handleRemove(item.id)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove">
              <Trash2 className="size-3 text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
