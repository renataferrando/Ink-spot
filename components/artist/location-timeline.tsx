"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarDays, Trash2, Pencil, X } from "lucide-react";

import type { ArtistLocation } from "@/types/artist";
import { deleteLocation, updateLocation, type ManageLocationState } from "@/actions/artist/manage-locations";
import { dateRangesOverlap } from "@/lib/location";
import { PlaceAutocomplete } from "@/components/forms/place-autocomplete";
import { btnPrimarySm, btnSecondarySm, labelClass } from "@/lib/ui/classes";
import {
  fieldInputClass,
  fieldLabelRowClass,
  fieldOptionalMarkClass,
  fieldErrorClass,
  formStackClass,
  ghostTextButtonClass,
} from "@/lib/ui/field-classes";

const selectClass =
  "w-full appearance-none rounded-(--r-md) bg-surface-2 border border-hairline px-4 py-3.5 text-[15px] text-(--text) outline-none transition-[border-color,box-shadow] duration-150 focus:border-ink-spot focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-55";

interface LocationTimelineProps {
  currentLocation?: ArtistLocation | null;
  upcomingLocations?: ArtistLocation[];
  /** When true, renders edit and delete controls (dashboard only). */
  editable?: boolean;
}

function formatDateRange(starts_at?: string | null, ends_at?: string | null) {
  if (!starts_at) return null;
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const start = fmt.format(new Date(starts_at));
  if (!ends_at) return start;
  return `${start} – ${fmt.format(new Date(ends_at))}`;
}

function KindBadge({ kind }: { kind: ArtistLocation["kind"] }) {
  const label = kind === "home_base" ? "Home base" : kind === "guest_spot" ? "Guest spot" : "Traveling";
  return (
    <span className="border-hairline text-dim shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] capitalize">
      {label}
    </span>
  );
}

// ── Inline edit form for a travel entry ───────────────────────────────────────

function EditTravelCard({
  loc,
  otherLocs,
  onCancel,
  onMutate,
}: {
  loc: ArtistLocation;
  otherLocs: ArtistLocation[];
  onCancel: () => void;
  onMutate: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const existingStart = loc.starts_at?.slice(0, 10);
  // Allow keeping a past start date that's already in effect, but not picking an earlier one.
  const startMin = existingStart && existingStart < today ? existingStart : today;

  const [changingLocation, setChangingLocation] = useState(false);
  const [startsAt, setStartsAt] = useState(existingStart ?? "");
  const [endsAt, setEndsAt] = useState(loc.ends_at?.slice(0, 10) ?? "");
  const [clientConflict, setClientConflict] = useState<string | null>(null);

  const [state, action, pending] = useActionState<ManageLocationState, FormData>(
    async (_prev, fd) => {
      const result = await updateLocation(_prev, fd);
      if (result.success) onMutate();
      return result;
    },
    {},
  );

  function checkConflict(start: string, end: string) {
    if (!start) {
      setClientConflict(null);
      return;
    }
    for (const other of otherLocs) {
      if (!other.starts_at) continue;
      if (dateRangesOverlap(start, end || null, other.starts_at, other.ends_at)) {
        setClientConflict(
          `Conflicts with "${other.location_name.split(",")[0]}". Choose different dates.`,
        );
        return;
      }
    }
    setClientConflict(null);
  }

  return (
    <form action={action} className="bg-surface border-hairline rounded-xl border px-4 py-3">
      <input type="hidden" name="id" value={loc.id} />

      <div className={formStackClass}>
        {/* Location */}
        <div>
          <div className={fieldLabelRowClass}>
            <label className={labelClass}>Location</label>
            <span className="text-[10px] text-red-400">*</span>
          </div>
          {!changingLocation ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="text-ink-spot size-3.5 shrink-0" aria-hidden />
                <span className="truncate text-[14px] text-(--text)">{loc.location_name}</span>
              </div>
              <button
                type="button"
                onClick={() => setChangingLocation(true)}
                className={ghostTextButtonClass}
              >
                Change
              </button>
              <input type="hidden" name="address" value={loc.location_name} />
              <input type="hidden" name="address_lat" value={loc.lat} />
              <input type="hidden" name="address_lng" value={loc.lng} />
            </div>
          ) : (
            <PlaceAutocomplete name="address" placeholder="City, country" required disabled={pending} />
          )}
        </div>

        {/* Kind */}
        <div>
          <div className={fieldLabelRowClass}>
            <label htmlFor={`edit-kind-${loc.id}`} className={labelClass}>Type</label>
          </div>
          <select
            name="kind"
            id={`edit-kind-${loc.id}`}
            defaultValue={loc.kind}
            disabled={pending}
            className={selectClass}
          >
            <option value="guest_spot">Guest spot</option>
            <option value="traveling">Traveling</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={fieldLabelRowClass}>
              <label htmlFor={`edit-starts-${loc.id}`} className={labelClass}>From</label>
              <span className={fieldOptionalMarkClass}>optional</span>
            </div>
            <input
              id={`edit-starts-${loc.id}`}
              name="starts_at"
              type="date"
              value={startsAt}
              min={startMin}
              onChange={(e) => {
                const val = e.target.value;
                setStartsAt(val);
                if (endsAt && endsAt < val) setEndsAt("");
                checkConflict(val, endsAt && endsAt >= val ? endsAt : "");
              }}
              disabled={pending}
              className={fieldInputClass}
            />
          </div>
          <div>
            <div className={fieldLabelRowClass}>
              <label htmlFor={`edit-ends-${loc.id}`} className={labelClass}>To</label>
              <span className={fieldOptionalMarkClass}>optional</span>
            </div>
            <input
              id={`edit-ends-${loc.id}`}
              name="ends_at"
              type="date"
              value={endsAt}
              min={startsAt || today}
              onChange={(e) => {
                setEndsAt(e.target.value);
                checkConflict(startsAt, e.target.value);
              }}
              disabled={pending}
              className={fieldInputClass}
            />
          </div>
        </div>

        {/* Studio */}
        <div>
          <div className={fieldLabelRowClass}>
            <label htmlFor={`edit-studio-${loc.id}`} className={labelClass}>Studio name</label>
            <span className={fieldOptionalMarkClass}>optional</span>
          </div>
          <input
            id={`edit-studio-${loc.id}`}
            name="studio_name"
            type="text"
            defaultValue={loc.studio_name ?? ""}
            disabled={pending}
            className={fieldInputClass}
          />
        </div>

        {(clientConflict || state?.error) && (
          <p className={fieldErrorClass}>{clientConflict ?? state.error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className={btnPrimarySm}
            disabled={pending || !!clientConflict}
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={btnSecondarySm}
            disabled={pending}
            aria-label="Cancel edit"
          >
            <X size={13} aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Read-only card ─────────────────────────────────────────────────────────────

function LocationCard({
  loc,
  isCurrent,
  editable,
  onEdit,
  onMutate,
}: {
  loc: ArtistLocation;
  isCurrent?: boolean;
  editable?: boolean;
  onEdit?: () => void;
  onMutate: () => void;
}) {
  const dateLabel = formatDateRange(loc.starts_at, loc.ends_at);

  async function handleDelete() {
    await deleteLocation(loc.id);
    onMutate();
  }

  return (
    <div className="bg-surface border-hairline flex items-start gap-3 rounded-xl border px-4 py-3">
      {isCurrent ? (
        <MapPin className="text-ink-spot mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <CalendarDays className="text-dim mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        {isCurrent && (
          <p className="text-ink-spot mb-0.5 font-mono text-[10px] tracking-[0.12em] uppercase">
            Here now
          </p>
        )}
        <p className="truncate text-[14px] text-(--text)">{loc.location_name}</p>
        {loc.studio_name && <p className="text-dim text-[12px]">{loc.studio_name}</p>}
        {dateLabel && <p className="text-dim text-[12px]">{dateLabel}</p>}
        {!loc.starts_at && !isCurrent && loc.kind !== "home_base" && (
          <p className="text-faint text-[11px] italic">No dates set</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <KindBadge kind={loc.kind} />
        {editable && loc.kind !== "home_base" && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className={ghostTextButtonClass}
                aria-label="Edit"
              >
                <Pencil size={11} aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="text-faint hover:text-red-400 cursor-pointer border-0 bg-transparent p-1 transition-colors"
              aria-label="Delete location"
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function LocationTimeline({
  currentLocation,
  upcomingLocations = [],
  editable = false,
}: LocationTimelineProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  function onMutate() {
    setEditingId(null);
    router.refresh();
  }

  const now = new Date();

  const active = upcomingLocations.filter(
    (l) => l.starts_at && new Date(l.starts_at) <= now && (!l.ends_at || new Date(l.ends_at) >= now),
  );
  const upcoming = upcomingLocations.filter(
    (l) => l.starts_at && new Date(l.starts_at) > now,
  );
  const undated = upcomingLocations.filter((l) => !l.starts_at);

  // All travel entries combined — used to find "other" locs when validating edits
  const allTravel = [
    ...(currentLocation && currentLocation.kind !== "home_base" ? [currentLocation] : []),
    ...upcomingLocations.filter((l) => l.kind !== "home_base"),
  ];

  const hasContent =
    currentLocation || active.length > 0 || upcoming.length > 0 || undated.length > 0;
  if (!hasContent) return null;

  function renderEntry(loc: ArtistLocation, isCurrent = false) {
    if (editable && editingId === loc.id) {
      return (
        <EditTravelCard
          key={loc.id}
          loc={loc}
          otherLocs={allTravel.filter((l) => l.id !== loc.id)}
          onCancel={() => setEditingId(null)}
          onMutate={onMutate}
        />
      );
    }
    return (
      <LocationCard
        key={loc.id}
        loc={loc}
        isCurrent={isCurrent}
        editable={editable}
        onEdit={loc.kind !== "home_base" ? () => setEditingId(loc.id) : undefined}
        onMutate={onMutate}
      />
    );
  }

  return (
    <section className="space-y-2">
      {currentLocation && renderEntry(currentLocation, true)}

      {active.map((loc) => renderEntry(loc))}

      {upcoming.map((loc) => renderEntry(loc))}

      {undated.length > 0 && (
        <>
          {editable && (active.length > 0 || upcoming.length > 0 || currentLocation) && (
            <p className="text-faint px-1 pt-1 font-mono text-[10px] tracking-widest uppercase">
              Saved · no dates
            </p>
          )}
          {undated.map((loc) => renderEntry(loc))}
        </>
      )}
    </section>
  );
}
