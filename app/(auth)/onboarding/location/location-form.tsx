"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PlaceAutocomplete } from "@/components/forms/place-autocomplete";
import { addLocation, type ManageLocationState } from "@/actions/artist/manage-locations";

export function LocationForm() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);

  const [state, action, pending] = useActionState<ManageLocationState, FormData>(
    async (_prev, fd) => {
      const result = await addLocation(_prev, fd);
      if (result.success) router.push("/onboarding/portfolio");
      return result;
    },
    {},
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <input type="hidden" name="kind" value="home_base" />

      {/* Location */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <label className="label">Where do you tattoo?</label>
          <span style={{ color: "#f87171", fontSize: 10 }}>*</span>
        </div>
        <PlaceAutocomplete
          name="address"
          placeholder="Santa Teresa, Puntarenas…"
          required
          disabled={pending}
        />
        <p style={{ fontSize: 12, color: "var(--faint)", margin: "6px 0 0", lineHeight: 1.5 }}>
          Select a suggestion from the dropdown so we can place you on the map.
        </p>
      </div>

      {/* Studio name */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <label htmlFor="studio_name" className="label">Studio name at this location</label>
          <span style={{ fontFamily: "var(--font-jetbrains, ui-monospace)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--faint)" }}>(optional)</span>
        </div>
        <input
          id="studio_name"
          name="studio_name"
          type="text"
          placeholder="Pura Vida Tattoo Studio"
          maxLength={100}
          disabled={pending}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: "var(--surface-2)",
            border: `1px solid ${focused ? "var(--accent)" : "var(--hairline)"}`,
            boxShadow: focused ? "0 0 0 3px var(--accent-soft)" : "none",
            borderRadius: "var(--r-md)",
            padding: "14px 16px",
            fontSize: 15,
            color: "var(--text)",
            outline: "none",
            opacity: pending ? 0.55 : 1,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />
      </div>

      {state.error && (
        <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{state.error}</p>
      )}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : <><span>Continue</span><ArrowRight size={14} /></>}
      </button>
    </form>
  );
}
