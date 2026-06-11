"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, CheckCircle, X } from "lucide-react";

import { btnPrimaryLg, btnSecondarySm, labelClass } from "@/lib/ui/classes";
import {
  fieldInputClass,
  fieldLabelRowClass,
  fieldOptionalMarkClass,
  fieldErrorClass,
  formStackClass,
  surfacePanelClass,
  ghostTextButtonClass,
} from "@/lib/ui/field-classes";
import { PlaceAutocomplete } from "@/components/forms/place-autocomplete";
import { setHomeBase, type ManageLocationState } from "@/actions/artist/manage-locations";
import type { ArtistLocation } from "@/types/artist";

interface HomeBaseSectionProps {
  homeBase: ArtistLocation | null;
  isActive: boolean;
}

export function HomeBaseSection({ homeBase, isActive }: HomeBaseSectionProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(!homeBase);
  const [formKey, setFormKey] = useState(0);
  const [changingLocation, setChangingLocation] = useState(!homeBase);

  const [state, action, pending] = useActionState<ManageLocationState, FormData>(
    async (_prev, fd) => {
      const result = await setHomeBase(_prev, fd);
      if (result.success) {
        setFormKey((k) => k + 1);
        setEditing(false);
        setChangingLocation(false);
        router.refresh();
      }
      return result;
    },
    {},
  );

  function handleEditClick() {
    setEditing(true);
    setChangingLocation(false);
  }

  function handleCancel() {
    setEditing(false);
    setChangingLocation(false);
  }

  return (
    <div className="space-y-3">
      {homeBase && !editing && (
        <div className="bg-surface border-hairline flex items-start gap-3 rounded-xl border px-4 py-3">
          <MapPin
            className={isActive ? "text-ink-spot mt-0.5 size-4 shrink-0" : "text-dim mt-0.5 size-4 shrink-0"}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            {isActive && (
              <p className="text-ink-spot mb-0.5 font-mono text-[10px] tracking-[0.12em] uppercase">
                Here now
              </p>
            )}
            <p className="truncate text-[14px] text-(--text)">{homeBase.location_name}</p>
            {homeBase.studio_name && (
              <p className="text-dim text-[12px]">{homeBase.studio_name}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="border-hairline text-dim shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] capitalize">
              Home base
            </span>
            <button
              type="button"
              onClick={handleEditClick}
              className={ghostTextButtonClass}
              aria-label="Edit home base"
            >
              <Pencil size={11} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {(!homeBase || editing) && (
        <form key={formKey} action={action} className={surfacePanelClass}>
          <div className={formStackClass}>
            {!homeBase && (
              <p className="text-dim text-[13px]">
                Set your home base — the city where you tattoo by default.
              </p>
            )}

            <div>
              <div className={fieldLabelRowClass}>
                <label className={labelClass}>Location</label>
                <span className="text-[10px] text-red-400">*</span>
              </div>

              {homeBase && !changingLocation ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="text-ink-spot size-3.5 shrink-0" aria-hidden />
                    <span className="truncate text-[14px] text-(--text)">
                      {homeBase.location_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChangingLocation(true)}
                    className={ghostTextButtonClass}
                  >
                    Change
                  </button>
                  <input type="hidden" name="address" value={homeBase.location_name} />
                  <input type="hidden" name="address_lat" value={homeBase.lat} />
                  <input type="hidden" name="address_lng" value={homeBase.lng} />
                </div>
              ) : (
                <PlaceAutocomplete
                  name="address"
                  placeholder="City, country"
                  required
                  disabled={pending}
                />
              )}
            </div>

            <div>
              <div className={fieldLabelRowClass}>
                <label htmlFor="hb-studio" className={labelClass}>Studio name</label>
                <span className={fieldOptionalMarkClass}>optional</span>
              </div>
              <input
                id="hb-studio"
                name="studio_name"
                type="text"
                placeholder="Pura Vida Tattoo"
                defaultValue={homeBase?.studio_name ?? ""}
                disabled={pending}
                className={fieldInputClass}
              />
            </div>

            {state.error && <p className={fieldErrorClass}>{state.error}</p>}

            <div className="flex gap-2">
              <button type="submit" className={btnPrimaryLg} disabled={pending}>
                {pending ? "Saving…" : "Save home base"}
              </button>
              {homeBase && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={btnSecondarySm}
                  disabled={pending}
                  aria-label="Cancel"
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </div>

            {!homeBase && state.success && (
              <div className="flex items-center gap-2 text-[13px] text-ink-spot">
                <CheckCircle size={14} aria-hidden />
                Home base saved.
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
