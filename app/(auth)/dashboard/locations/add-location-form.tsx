"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { btnPrimaryLg } from "@/lib/ui/classes";
import { PlaceAutocomplete } from "@/components/forms/place-autocomplete";
import { addLocation, type ManageLocationState } from "@/actions/artist/manage-locations";

export function AddLocationForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ManageLocationState, FormData>(
    async (_prev, fd) => {
      const result = await addLocation(_prev, fd);
      if (result.success) router.refresh();
      return result;
    },
    {},
  );

  return (
    <form action={action} className="border-border bg-card space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Location *</label>
        <PlaceAutocomplete name="address" placeholder="City, country" required disabled={pending} />
      </div>
      <div className="space-y-2">
        <label htmlFor="loc-kind" className="text-sm font-medium">
          Type
        </label>
        <select
          name="kind"
          id="loc-kind"
          disabled={pending}
          className="border-border bg-input/30 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="home_base">Home base</option>
          <option value="guest_spot">Guest spot</option>
          <option value="traveling">Traveling</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="loc-starts" className="text-muted-foreground text-xs">
            From
          </label>
          <Input id="loc-starts" name="starts_at" type="date" disabled={pending} />
        </div>
        <div className="space-y-1">
          <label htmlFor="loc-ends" className="text-muted-foreground text-xs">
            To
          </label>
          <Input id="loc-ends" name="ends_at" type="date" disabled={pending} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="loc-studio" className="text-sm font-medium">
          Studio name <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Input
          id="loc-studio"
          name="studio_name"
          placeholder="Pura Vida Tattoo"
          disabled={pending}
        />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <button type="submit" className={btnPrimaryLg} disabled={pending}>
        {pending ? "Saving…" : "Add location"}
      </button>
    </form>
  );
}
