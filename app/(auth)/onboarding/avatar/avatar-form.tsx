"use client";

import { useState, useRef } from "react";
import { useActionState } from "react";
import { Upload, Camera, Loader2 } from "lucide-react";
import Image from "next/image";

import { saveOnboardingAppearance, skipOnboardingAppearance } from "@/actions/artist/update-avatar";
import { previewInstagramMedia, type InstagramPreviewItem } from "@/actions/artist/import-instagram";
import {
  accentWordClass,
  fieldErrorClass,
  fieldOptionalMarkClass,
  ghostTextButtonClass,
  onboardingLeadClass,
  onboardingTitleClass,
  surfacePanelClass,
} from "@/lib/ui/field-classes";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, labelClass } from "@/lib/ui/classes";

const slotBtnClass =
  "h-9 px-4 rounded-full bg-surface-2 border border-ds-border font-mono text-[10px] tracking-[0.12em] uppercase text-(--text) flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-surface-3 disabled:opacity-55 disabled:cursor-not-allowed";

function IgPhotoPicker({
  items,
  loading,
  onSelect,
  onClose,
}: {
  items: InstagramPreviewItem[];
  loading: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  return (
    <div className={cn(surfacePanelClass, "space-y-3")}>
      <div className="flex items-center justify-between">
        <p className={cn(labelClass, "text-(--text)")}>Your Instagram posts</p>
        <button
          type="button"
          onClick={onClose}
          className={ghostTextButtonClass}
        >
          Cancel
        </button>
      </div>

      {loading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="text-dim size-5 animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-dim text-sm">No importable posts found.</p>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {items.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.media_url)}
            className="relative aspect-square overflow-hidden rounded-lg transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.media_url} alt={m.caption ?? ""} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface SlotState {
  preview: string | null;
  igUrl: string | null;
}

export function AvatarForm({ hasInstagramToken }: { hasInstagramToken: boolean }) {
  const [saveState, saveAction, savePending] = useActionState(
    async (_prev: { error?: string } | null, fd: FormData) => saveOnboardingAppearance(fd),
    null,
  );

  const [avatar, setAvatar] = useState<SlotState>({ preview: null, igUrl: null });
  const [cover, setCover] = useState<SlotState>({ preview: null, igUrl: null });

  const [igItems, setIgItems] = useState<InstagramPreviewItem[]>([]);
  const [igLoading, setIgLoading] = useState(false);
  const [igLoaded, setIgLoaded] = useState(false);
  const [igError, setIgError] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<"avatar" | "cover" | null>(null);

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, slot: "avatar" | "cover") {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (slot === "avatar") setAvatar({ preview: url, igUrl: null });
    else setCover({ preview: url, igUrl: null });
  }

  function clearSlot(slot: "avatar" | "cover") {
    if (slot === "avatar") {
      setAvatar({ preview: null, igUrl: null });
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    } else {
      setCover({ preview: null, igUrl: null });
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
    if (activePicker === slot) setActivePicker(null);
  }

  async function openPicker(slot: "avatar" | "cover") {
    setActivePicker(slot);
    setIgError(null);
    if (!igLoaded) {
      setIgLoading(true);
      const result = await previewInstagramMedia();
      setIgLoading(false);
      if (result.error) {
        setIgError(result.error);
        setActivePicker(null);
        return;
      }
      setIgLoaded(true);
      setIgItems(result.items ?? []);
    }
  }

  function selectIg(slot: "avatar" | "cover", url: string) {
    if (slot === "avatar") {
      setAvatar({ preview: url, igUrl: url });
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    } else {
      setCover({ preview: url, igUrl: url });
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
    setActivePicker(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className={onboardingTitleClass}>
          Your <span className={accentWordClass}>look</span>
        </h1>
        <p className={onboardingLeadClass}>
          Add a profile photo and optional cover for your public page — or skip and we&apos;ll use
          your first portfolio image where possible.
        </p>
      </div>

      <form action={saveAction} className="space-y-4">
        {/* Hidden file inputs — always in DOM so FormData picks them up */}
        <input
          ref={avatarFileRef}
          name="avatar"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e, "avatar")}
          tabIndex={-1}
        />
        <input
          ref={coverFileRef}
          name="cover"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e, "cover")}
          tabIndex={-1}
        />
        {avatar.igUrl && <input type="hidden" name="avatar_ig_url" value={avatar.igUrl} />}
        {cover.igUrl && <input type="hidden" name="cover_ig_url" value={cover.igUrl} />}

        {/* Profile photo slot */}
        <div className="space-y-2">
          <p className={labelClass}>Profile photo</p>
          <div className={cn(surfacePanelClass)}>
            {avatar.preview ? (
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
                  <Image src={avatar.preview} alt="Profile photo preview" fill sizes="48px" className="object-cover" />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className={slotBtnClass}
                    disabled={!!savePending}
                  >
                    <Upload size={11} aria-hidden /> Change
                  </button>
                  <button
                    type="button"
                    onClick={() => clearSlot("avatar")}
                    className={ghostTextButtonClass}
                    disabled={!!savePending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  className={slotBtnClass}
                  disabled={!!savePending}
                >
                  <Upload size={11} aria-hidden /> Upload from device
                </button>
                {hasInstagramToken && (
                  <button
                    type="button"
                    onClick={() => openPicker("avatar")}
                    className={slotBtnClass}
                    disabled={!!savePending || activePicker === "avatar"}
                  >
                    <Camera size={11} aria-hidden /> Instagram
                  </button>
                )}
              </div>
            )}
          </div>
          {activePicker === "avatar" && (
            <IgPhotoPicker
              items={igItems}
              loading={igLoading}
              onSelect={(url) => selectIg("avatar", url)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {/* Cover image slot */}
        <div className="space-y-2">
          <p className={labelClass}>
            Cover image <span className={fieldOptionalMarkClass}>optional</span>
          </p>
          <div className={cn(surfacePanelClass, "space-y-3")}>
            {cover.preview && (
              <div className="relative h-20 w-full overflow-hidden rounded-lg">
                <Image src={cover.preview} alt="Cover image preview" fill sizes="100vw" className="object-cover" />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                className={slotBtnClass}
                disabled={!!savePending}
              >
                <Upload size={11} aria-hidden /> {cover.preview ? "Change" : "Upload from device"}
              </button>
              {hasInstagramToken && (
                <button
                  type="button"
                  onClick={() => openPicker("cover")}
                  className={slotBtnClass}
                  disabled={!!savePending || activePicker === "cover"}
                >
                  <Camera size={11} aria-hidden /> Instagram
                </button>
              )}
              {cover.preview && (
                <button
                  type="button"
                  onClick={() => clearSlot("cover")}
                  className={ghostTextButtonClass}
                  disabled={!!savePending}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {activePicker === "cover" && (
            <IgPhotoPicker
              items={igItems}
              loading={igLoading}
              onSelect={(url) => selectIg("cover", url)}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {(saveState?.error || igError) && (
          <p className={fieldErrorClass}>{saveState?.error ?? igError}</p>
        )}

        <button type="submit" className={cn(btnPrimaryClass, "mt-2")} disabled={!!savePending}>
          {savePending ? "Saving…" : "Save & go to dashboard"}
        </button>
      </form>

      <form action={skipOnboardingAppearance}>
        <button
          type="submit"
          disabled={!!savePending}
          className={cn(ghostTextButtonClass, "mt-2 block w-full py-3")}
        >
          Skip — use portfolio · initials as fallback
        </button>
      </form>
    </div>
  );
}
