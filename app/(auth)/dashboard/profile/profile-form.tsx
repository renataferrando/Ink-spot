"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, type UpdateProfileState } from "@/actions/artist/update-profile";

interface Props {
  defaultBio?: string;
  defaultWebsite?: string;
  defaultEmail?: string;
  defaultYears?: number;
}

export function ProfileForm({ defaultBio, defaultWebsite, defaultEmail, defaultYears }: Props) {
  const [state, action, pending] = useActionState<UpdateProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio <span className="text-muted-foreground text-xs">(max 200 chars)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={defaultBio}
          maxLength={200}
          rows={3}
          disabled={pending}
          className="border-border bg-input/30 placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="website_url" className="text-sm font-medium">
          Website
        </label>
        <Input
          id="website_url"
          name="website_url"
          type="url"
          defaultValue={defaultWebsite}
          placeholder="https://yourstudio.com"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="contact_email" className="text-sm font-medium">
          Contact email
        </label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="bookings@yourstudio.com"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="years_experience" className="text-sm font-medium">
          Years of experience <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Input
          id="years_experience"
          name="years_experience"
          type="number"
          min={0}
          max={60}
          defaultValue={defaultYears}
          disabled={pending}
        />
      </div>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && (
        <p className="text-primary flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="size-4" /> Saved.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
