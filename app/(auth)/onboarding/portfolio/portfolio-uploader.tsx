"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, Camera, Loader2, X } from "lucide-react";
import Image from "next/image";

import { addPortfolioItem } from "@/actions/artist/add-portfolio-item";
import {
  previewInstagramMedia,
  importInstagramItems,
  type InstagramPreviewItem,
  type ImportItem,
} from "@/actions/artist/import-instagram";
import {
  accentWordClass,
  fieldErrorClass,
  onboardingLeadClass,
  onboardingTitleClass,
  uploadDropzoneClass,
} from "@/lib/ui/field-classes";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, btnSecondaryClass, labelClass } from "@/lib/ui/classes";

const MAX_IMAGES = 30;
const MAX_MB = 5;

interface UploadedItem {
  url: string;
  name: string;
}

export function PortfolioUploader({
  hasInstagramToken,
  initialItems,
}: {
  hasInstagramToken: boolean;
  initialItems: UploadedItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<UploadedItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instagram picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [igItems, setIgItems] = useState<InstagramPreviewItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (items.length >= MAX_IMAGES) return;
      setError(null);
      const toUpload = Array.from(files).slice(0, MAX_IMAGES - items.length);
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); continue; }
        if (file.size > MAX_MB * 1024 * 1024) { setError(`${file.name} exceeds 5 MB.`); continue; }
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = (await res.json()) as { url?: string; error?: string };
        if (json.error) { setError(json.error); setUploading(false); continue; }
        if (json.url) {
          const dbResult = await addPortfolioItem(json.url, file.name.replace(/\.[^.]+$/, ""));
          if (dbResult.error) { setError(dbResult.error); setUploading(false); continue; }
          setItems((prev) => [...prev, { url: json.url!, name: file.name }]);
        }
        setUploading(false);
      }
    },
    [items],
  );

  async function openPicker() {
    setPickerOpen(true);
    setSelected(new Set());
    setError(null);
    setPreviewing(true);
    const result = await previewInstagramMedia();
    setPreviewing(false);
    if (result.error) { setError(result.error); setPickerOpen(false); return; }
    setIgItems(result.items ?? []);
  }

  function toggleSelect(id: string, alreadyImported: boolean) {
    if (alreadyImported) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleImport() {
    if (!selected.size) return;
    setImporting(true);
    const toImport: ImportItem[] = igItems
      .filter((m) => selected.has(m.id))
      .map((m) => ({ ig_media_id: m.id, media_url: m.media_url, caption: m.caption, timestamp: m.timestamp }));
    const result = await importInstagramItems(toImport);
    setImporting(false);
    if (result.error) { setError(result.error); return; }
    setPickerOpen(false);
    router.refresh();
  }

  const slots = MAX_IMAGES - items.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={onboardingTitleClass}>
          Upload your <span className={accentWordClass}>portfolio</span>.
        </h1>
        <p className={cn(onboardingLeadClass, "mt-2")}>
          Add your best work — up to {MAX_IMAGES} photos, {MAX_MB}&nbsp;MB each.
        </p>
      </div>

      {/* Upload dropzone */}
      <label
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={uploadDropzoneClass(dragOver)}
      >
        <Upload size={28} className="text-dim" aria-hidden />
        <div>
          <p className="m-0 mb-1 text-sm font-medium text-(--text)">Drag photos here or click to select</p>
          <span className={labelClass}>{items.length}/{MAX_IMAGES} uploaded</span>
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

      {/* Instagram import */}
      {hasInstagramToken && slots > 0 && !pickerOpen && (
        <button
          type="button"
          onClick={openPicker}
          disabled={previewing}
          className={cn(btnSecondaryClass, "flex w-full items-center justify-center gap-2")}
        >
          {previewing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Import from Instagram
        </button>
      )}

      {/* Instagram picker */}
      {pickerOpen && (
        <div className="border-hairline space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your Instagram posts</p>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="text-dim hover:text-(--text) font-mono text-[10px] tracking-[0.12em] uppercase"
            >
              Cancel
            </button>
          </div>

          {igItems.length === 0 && !previewing && (
            <p className="text-dim text-sm">No importable posts found.</p>
          )}

          {previewing && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="text-dim size-6 animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {igItems.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleSelect(m.id, m.already_imported)}
                disabled={m.already_imported}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg transition-all",
                  m.already_imported && "opacity-40 cursor-not-allowed",
                  selected.has(m.id) && "ring-2 ring-offset-1 ring-ink-spot",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.media_url} alt={m.caption ?? ""} className="h-full w-full object-cover" />
                {selected.has(m.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <CheckCircle2 className="size-6 text-white" />
                  </div>
                )}
                {m.already_imported && (
                  <div className="absolute bottom-1 left-0 right-0 text-center">
                    <span className="bg-black/60 rounded px-1.5 py-0.5 font-mono text-[9px] text-white uppercase tracking-wide">Added</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="space-y-3">
              {/* Preview strip */}
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
                        className="relative size-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-ink-spot transition-opacity hover:opacity-80"
                      >
                        <Image src={m.media_url} alt={m.caption ?? ""} fill sizes="80px" className="object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                          <X className="size-4 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className={cn(btnPrimaryClass, "w-full")}
              >
                {importing ? <Loader2 className="size-4 animate-spin" /> : null}
                {importing ? "Importing…" : `Import ${selected.size} photo${selected.size > 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className={fieldErrorClass}>{error}</p>}
      {uploading && <p className={cn(labelClass, "text-center")}>Uploading…</p>}

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {items.filter((i) => i.url).map((item, i) => (
            <div key={i} className="bg-surface-2 relative aspect-square overflow-hidden rounded-(--r-sm)">
              <Image src={item.url} alt={item.name} fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className={btnPrimaryClass}
        onClick={() => router.push("/onboarding/avatar")}
        disabled={uploading || importing}
      >
        {items.length > 0 ? <><CheckCircle2 size={14} aria-hidden /> Continue</> : "Skip for now"}
      </button>
    </div>
  );
}
