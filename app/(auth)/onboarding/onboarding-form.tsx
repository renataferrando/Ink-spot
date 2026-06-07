"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { createProfile, type CreateProfileState } from "@/actions/artist/create-profile";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, labelClass } from "@/lib/ui/classes";
import {
  fieldErrorClass,
  fieldHintClass,
  fieldInputClass,
  fieldLabelRowClass,
  fieldOptionalMarkClass,
  fieldRequiredMarkClass,
  fieldTextareaClass,
  formStackClass,
} from "@/lib/ui/field-classes";

export function OnboardingForm() {
  const [state, action, pending] = useActionState<CreateProfileState, FormData>(createProfile, {});

  return (
    <form action={action} className={formStackClass}>
      <div>
        <div className={fieldLabelRowClass}>
          <label htmlFor="studio_name" className={labelClass}>
            Studio name
          </label>
          <span className={fieldRequiredMarkClass}>*</span>
        </div>
        <input
          id="studio_name"
          name="studio_name"
          type="text"
          placeholder="Luna Negra Studio"
          required
          minLength={2}
          maxLength={100}
          disabled={pending}
          className={fieldInputClass}
        />
      </div>

      <div>
        <div className={fieldLabelRowClass}>
          <label htmlFor="instagram_handle" className={labelClass}>
            Instagram handle
          </label>
          <span className={fieldOptionalMarkClass}>(optional)</span>
        </div>
        <div className="relative">
          <span className="text-dim pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-sm">
            @
          </span>
          <input
            id="instagram_handle"
            name="instagram_handle"
            type="text"
            placeholder="yourstudio"
            maxLength={30}
            pattern="[a-zA-Z0-9_.]+"
            disabled={pending}
            className={cn(fieldInputClass, "pl-8")}
          />
        </div>
        <p className={fieldHintClass}>We&apos;ll ask you to verify this with a quick bio code.</p>
      </div>

      <div>
        <div className={fieldLabelRowClass}>
          <label htmlFor="bio" className={labelClass}>
            Short bio
          </label>
          <span className={fieldOptionalMarkClass}>(optional, max 200)</span>
        </div>
        <textarea
          id="bio"
          name="bio"
          placeholder="Blackwork and dotwork based in Santa Teresa…"
          maxLength={200}
          rows={3}
          disabled={pending}
          className={fieldTextareaClass}
        />
      </div>

      <div>
        <div className={fieldLabelRowClass}>
          <label htmlFor="years_experience" className={labelClass}>
            Years of experience
          </label>
          <span className={fieldOptionalMarkClass}>(optional)</span>
        </div>
        <input
          id="years_experience"
          name="years_experience"
          type="number"
          placeholder="5"
          disabled={pending}
          className={fieldInputClass}
        />
      </div>

      {state.error && <p className={fieldErrorClass}>{state.error}</p>}

      <button type="submit" className={btnPrimaryClass} disabled={pending}>
        {pending ? (
          "Creating profile…"
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
