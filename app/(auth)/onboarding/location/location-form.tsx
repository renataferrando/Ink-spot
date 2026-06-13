"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PlaceAutocomplete } from "@/components/forms/place-autocomplete";
import { setHomeBase, type ManageLocationState } from "@/actions/artist/manage-locations";
import {
  fieldErrorClass,
  fieldHintClass,
  fieldInputClass,
  fieldLabelRowClass,
  fieldOptionalMarkClass,
  fieldRequiredMarkClass,
  formStackClass,
} from "@/lib/ui/field-classes";
import { btnPrimaryClass, labelClass } from "@/lib/ui/classes";

export function LocationForm() {
  const router = useRouter();

  const [state, action, pending] = useActionState<ManageLocationState, FormData>(
    async (_prev, fd) => {
      const result = await setHomeBase(_prev, fd);
      if (result.success) router.push("/onboarding/portfolio");
      return result;
    },
    {},
  );

  return (
    <form action={action} className={formStackClass}>

      <div>
        <div className={fieldLabelRowClass}>
          <label className={labelClass}>Where do you tattoo?</label>
          <span className={fieldRequiredMarkClass}>*</span>
        </div>
        <PlaceAutocomplete
          name="address"
          placeholder="City, country…"
          required
          disabled={pending}
        />
        <p className={fieldHintClass}>
          Search for your city or pick a spot on the map so we can place you correctly.
        </p>
      </div>

      <div>
        <div className={fieldLabelRowClass}>
          <label htmlFor="studio_name" className={labelClass}>
            Studio name at this location
          </label>
          <span className={fieldOptionalMarkClass}>(optional)</span>
        </div>
        <input
          id="studio_name"
          name="studio_name"
          type="text"
          placeholder="Pura Vida Tattoo Studio"
          maxLength={100}
          disabled={pending}
          className={fieldInputClass}
        />
      </div>

      {state.error && <p className={fieldErrorClass}>{state.error}</p>}

      <button type="submit" className={btnPrimaryClass} disabled={pending}>
        {pending ? (
          "Saving…"
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight size={14} aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
