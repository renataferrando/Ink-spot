"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form action={action} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Location *</label>
        <PlaceAutocomplete
          name="address"
          placeholder="City, country"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="loc-kind" className="text-sm font-medium">Type</label>
        <select name="kind" id="loc-kind" disabled={pending}
          className="w-full rounded-md border border-border bg-input/30 px-3 py-2 text-sm">
          <option value="home_base">Home base</option>
          <option value="guest_spot">Guest spot</option>
          <option value="traveling">Traveling</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="loc-starts" className="text-xs text-muted-foreground">From</label>
          <Input id="loc-starts" name="starts_at" type="date" disabled={pending} />
        </div>
        <div className="space-y-1">
          <label htmlFor="loc-ends" className="text-xs text-muted-foreground">To</label>
          <Input id="loc-ends" name="ends_at" type="date" disabled={pending} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="loc-studio" className="text-sm font-medium">
          Studio name <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Input id="loc-studio" name="studio_name" placeholder="Pura Vida Tattoo" disabled={pending} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Add location"}
      </Button>
    </form>
  );
}
