"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Trash2, Upload, Camera, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, btnSecondaryClass } from "@/lib/ui/classes";

import { addPortfolioItem, removePortfolioItem } from "@/actions/artist/add-portfolio-item";
import {
  previewInstagramMedia,
  importInstagramItems,
  type InstagramPreviewItem,
  type ImportItem,
} from "@/actions/artist/import-instagram";

interface Item {
  id: string;
  image_url: string;
  alt_text?: string | null;
  is_featured: boolean;
}

export function PortfolioManager({
  initialItems,
  hasInstagramToken,
}: {
  initialItems: Item[];
  hasInstagramToken: boolean;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instagram picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [igItems, setIgItems] = useState<InstagramPreviewItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<number | null>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (items.length >= 30) return;
      setError(null);
      for (const file of Array.from(files).slice(0, 30 - items.length)) {
        if (!file.type.startsWith("image/")) {
          setError("Images only.");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is over 5 MB.`);
          continue;
        }
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = (await res.json()) as { url?: string; error?: string };
        if (json.error) {
          setError(json.error);
        } else if (json.url) {
          const dbResult = await addPortfolioItem(json.url);
          if (dbResult.error) {
            setError(dbResult.error);
          } else if (dbResult.id) {
            setItems((p) => [
              ...p,
              {
                id: dbResult.id!,
                image_url: json.url!,
                is_featured: p.length === 0,
                alt_text: null,
              },
            ]);
          }
        }
        setUploading(false);
      }
    },
    [items],
  );

  async function handleRemove(id: string) {
    await removePortfolioItem(id);
    setItems((p) => p.filter((i) => i.id !== id));
  }

  async function openPicker() {
    setPickerOpen(true);
    setImportDone(null);
    setSelected(new Set());
    setError(null);
    setPreviewing(true);
    const result = await previewInstagramMedia();
    setPreviewing(false);
    if (result.error) {
      setError(result.error);
      setPickerOpen(false);
      return;
    }
    setIgItems(result.items ?? []);
  }

  function toggleSelect(id: string, alreadyImported: boolean) {
    if (alreadyImported) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleImport() {
    if (!selected.size) return;
    setImporting(true);
    const toImport: ImportItem[] = igItems
      .filter((m) => selected.has(m.id))
      .map((m) => ({
        ig_media_id: m.id,
        media_url: m.media_url,
        caption: m.caption,
        timestamp: m.timestamp,
      }));

    const result = await importInstagramItems(toImport);
    setImporting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setImportDone(result.imported);
    setPickerOpen(false);
    // Reload the page to reflect new items
    window.location.reload();
  }

  const availableSlots = 30 - items.length;
  const selectableCount = igItems.filter((m) => !m.already_imported).length;

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <label
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-hairline bg-surface hover:border-ink-spot/40 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed py-6 transition-colors"
      >
        <Upload className="text-dim size-5" aria-hidden />
        <span className="text-dim text-sm">Add photos ({items.length}/30)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading || items.length >= 30}
        />
      </label>

      {/* Instagram import button */}
      {hasInstagramToken && availableSlots > 0 && (
        <button
          type="button"
          onClick={openPicker}
          disabled={previewing}
          className={cn(btnSecondaryClass, "flex w-full items-center justify-center gap-2")}
        >
          {previewing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Camera className="size-4" aria-hidden />
          )}
          {previewing ? "Loading posts…" : "Import from Instagram"}
        </button>
      )}

      {importDone !== null && (
        <p className="text-dim text-xs">
          {importDone === 0
            ? "No new photos imported."
            : `${importDone} photo${importDone !== 1 ? "s" : ""} imported.`}
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {uploading && <p className="text-dim text-xs">Uploading…</p>}

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface-2 group relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={item.image_url}
              alt={item.alt_text ?? "Portfolio"}
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove"
            >
              <Trash2 className="size-3 text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Instagram picker overlay */}
      {pickerOpen && (
        <div className="bg-bg/80 fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm sm:items-center">
          <div
            className="border-hairline bg-surface flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl border sm:rounded-2xl"
          >
            {/* Header */}
            <div className="border-hairline flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-text text-sm font-medium">Import from Instagram</p>
                {!previewing && selectableCount > 0 && (
                  <p className="text-dim mt-0.5 font-mono text-[10px] tracking-[0.12em] uppercase">
                    {selected.size} selected · {availableSlots} slot{availableSlots !== 1 ? "s" : ""} left
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-dim hover:text-text transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {previewing ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="text-dim size-6 animate-spin" />
                </div>
              ) : igItems.length === 0 ? (
                <p className="text-dim py-10 text-center text-sm">No Instagram posts found.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {igItems.map((m) => {
                    const isSelected = selected.has(m.id);
                    const disabled = m.already_imported;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleSelect(m.id, disabled)}
                        disabled={disabled}
                        className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none"
                        aria-pressed={isSelected}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.media_url}
                          alt={m.caption ?? "Instagram post"}
                          className={[
                            "h-full w-full object-cover transition-opacity",
                            disabled ? "opacity-30" : isSelected ? "opacity-70" : "opacity-100",
                          ].join(" ")}
                        />
                        {isSelected && !disabled && (
                          <div className="bg-ink-spot absolute inset-0 flex items-center justify-center bg-opacity-40">
                            <Check className="size-6 text-white drop-shadow" />
                          </div>
                        )}
                        {disabled && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                            <span className="text-faint font-mono text-[9px] tracking-[0.12em] uppercase">
                              Added
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {!previewing && igItems.length > 0 && (
              <div className="border-hairline space-y-3 border-t px-5 py-4">
                {/* Selected preview strip */}
                {selected.size > 0 && (
                  <div>
                    <p className="text-dim mb-2 font-mono text-[10px] tracking-[0.12em] uppercase">
                      Selected · {selected.size}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {igItems
                        .filter((m) => selected.has(m.id))
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleSelect(m.id, false)}
                            aria-label="Deselect"
                            className="relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-ink-spot transition-opacity hover:opacity-70"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.media_url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selected.size === 0 || importing}
                  className={cn(btnPrimaryClass, "w-full")}
                >
                  {importing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Importing…
                    </span>
                  ) : selected.size === 0 ? (
                    "Select photos to add"
                  ) : (
                    `Add ${selected.size} photo${selected.size !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
