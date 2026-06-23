"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

import { btnPrimaryLg, labelClass } from "@/lib/ui/classes";
import {
  fieldInputClass,
  fieldLabelRowClass,
  fieldOptionalMarkClass,
  fieldHintClass,
  fieldErrorClass,
  formStackClass,
  surfacePanelClass,
} from "@/lib/ui/field-classes";
import { dateRangesOverlap } from "@/lib/location";
import { PlaceAutocomplete } from "@/components/forms/place-autocomplete";
import { addLocation, type ManageLocationState } from "@/actions/artist/manage-locations";

type TravelKind = "guest_spot" | "traveling";

const KIND_DESCRIPTIONS: Record<TravelKind, string> = {
  guest_spot: "A temporary booking at another studio. Add dates so it shows in your timeline.",
  traveling: "You're on the road. Add dates so followers know when you'll be nearby.",
};

const selectClass =
  "w-full appearance-none rounded-(--r-md) bg-surface-2 border border-hairline px-4 py-3.5 text-[15px] text-(--text) outline-none transition-[border-color,box-shadow] duration-150 focus:border-ink-spot focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-55";

export interface ExistingTravelLoc {
  id: string;
  location_name: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface AddLocationFormProps {
  existingTravelLocs: ExistingTravelLoc[];
}

export function AddLocationForm({ existingTravelLocs }: AddLocationFormProps) {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [lastSaved, setLastSaved] = useState(false);
  const [kind, setKind] = useState<TravelKind>("guest_spot");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [clientConflict, setClientConflict] = useState<string | null>(null);

  const [state, action, pending] = useActionState<ManageLocationState, FormData>(
    async (_prev, fd) => {
      const result = await addLocation(_prev, fd);
      if (result.success) {
        setFormKey((k) => k + 1);
        setLastSaved(true);
        setStartsAt("");
        setEndsAt("");
        setClientConflict(null);
        router.refresh();
      }
      return result;
    },
    {},
  );

  function checkConflict(start: string, end: string) {
    if (!start) {
      setClientConflict(null);
      return;
    }
    for (const loc of existingTravelLocs) {
      if (!loc.starts_at) continue;
      if (dateRangesOverlap(start, end || null, loc.starts_at, loc.ends_at)) {
        setClientConflict(
          `Conflicts with "${loc.location_name.split(",")[0]}". Choose different dates.`,
        );
        return;
      }
    }
    setClientConflict(null);
  }

  const today = new Date().toISOString().slice(0, 10);
  const hasConflict = !!clientConflict;

  return (
    <div className="space-y-3">
      {lastSaved && (
        <div className="flex items-center gap-2 text-[13px] text-ink-spot">
          <CheckCircle size={14} aria-hidden />
          Travel entry saved.
        </div>
      )}

      <form key={formKey} action={action} className={surfacePanelClass}>
        <div className={formStackClass}>
          <div>
            <div className={fieldLabelRowClass}>
              <label className={labelClass}>Location</label>
              <span className="text-[10px] text-red-400">*</span>
            </div>
            <PlaceAutocomplete name="address" placeholder="City, country" required disabled={pending} />
          </div>

          <div>
            <div className={fieldLabelRowClass}>
              <label htmlFor="loc-kind" className={labelClass}>Type</label>
            </div>
            <select
              name="kind"
              id="loc-kind"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as TravelKind);
                setLastSaved(false);
              }}
              disabled={pending}
              className={selectClass}
            >
              <option value="guest_spot">Guest spot</option>
              <option value="traveling">Traveling</option>
            </select>
            <p className={fieldHintClass}>{KIND_DESCRIPTIONS[kind]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={fieldLabelRowClass}>
                <label htmlFor="loc-starts" className={labelClass}>From</label>
                <span className="text-[10px] text-red-400">*</span>
              </div>
              <input
                id="loc-starts"
                name="starts_at"
                type="date"
                value={startsAt}
                min={today}
                required
                onChange={(e) => {
                  const val = e.target.value;
                  setStartsAt(val);
                  if (endsAt && endsAt < val) setEndsAt("");
                  setLastSaved(false);
                  checkConflict(val, endsAt && endsAt >= val ? endsAt : "");
                }}
                disabled={pending}
                className={fieldInputClass}
              />
            </div>
            <div>
              <div className={fieldLabelRowClass}>
                <label htmlFor="loc-ends" className={labelClass}>To</label>
                <span className="text-[10px] text-red-400">*</span>
              </div>
              <input
                id="loc-ends"
                name="ends_at"
                type="date"
                value={endsAt}
                min={startsAt || today}
                required
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  setLastSaved(false);
                  checkConflict(startsAt, e.target.value);
                }}
                disabled={pending}
                className={fieldInputClass}
              />
            </div>
          </div>

          <div>
            <div className={fieldLabelRowClass}>
              <label htmlFor="loc-studio" className={labelClass}>Studio name</label>
              <span className={fieldOptionalMarkClass}>optional</span>
            </div>
            <input
              id="loc-studio"
              name="studio_name"
              type="text"
              placeholder="Pura Vida Tattoo"
              disabled={pending}
              className={fieldInputClass}
            />
          </div>

          {(clientConflict || state.error) && (
            <p className={fieldErrorClass}>{clientConflict ?? state.error}</p>
          )}

          <button type="submit" className={btnPrimaryLg} disabled={pending || hasConflict}>
            {pending ? "Saving…" : "Add travel dates"}
          </button>
        </div>
      </form>
    </div>
  );
}
