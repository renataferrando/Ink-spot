"use client";

import Image from "next/image";
import { useRef, useState, useTransition, useActionState } from "react";
import { CheckCircle2, ImageOff, Loader2, Upload, X } from "lucide-react";

import {
  updateProfile,
  setProfileActive,
  type UpdateProfileState,
  type ToggleActiveState,
} from "@/actions/artist/update-profile";
import { updateAppearance, type UpdateAppearanceState } from "@/actions/artist/update-avatar";
import {
  disconnectInstagram,
  type DisconnectInstagramState,
} from "@/actions/artist/disconnect-instagram";
import { ALL_STYLES, STYLE_LABELS, type ArtistStyle } from "@/types/artist";
import { cn } from "@/lib/utils";
import { InstagramConnectButton } from "@/components/onboarding/instagram-connect-button";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  btnSecondaryMd,
  chipClass,
  chipActiveClass,
  filterBarClass,
  labelClass,
} from "@/lib/ui/classes";

const MAX_STYLES = 3;

interface ProfileFormProps {
  oauthEnabled: boolean;
  artist: {
    handle: string;
    display_name: string;
    bio: string;
    instagram_handle: string;
    profile_image_url: string | null;
    cover_image_url: string | null;
    website_url: string;
    contact_email: string;
    years_experience: number | null;
    primary_styles: ArtistStyle[];
    is_active: boolean;
    is_claimed: boolean;
    verification_method: "bio_code" | "instagram_oauth" | null;
    instagram_account_type: "BUSINESS" | "CREATOR" | "PERSONAL" | null;
    instagram_token_expires_at: string | null;
  };
}

// Shared input class — focus ring + dark input surface from the design system.
const inputClass =
  "w-full rounded-(--r-md) bg-surface-2 border border-hairline px-4 py-3.5 text-[15px] text-(--text) outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-ink-spot focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-55";

export function ProfileForm({ artist, oauthEnabled }: ProfileFormProps) {
  return (
    <div className="space-y-9">
      <AppearanceSection
        handle={artist.handle}
        displayName={artist.display_name}
        avatarUrl={artist.profile_image_url}
        coverUrl={artist.cover_image_url}
      />

      <DetailsSection artist={artist} />

      <VerificationSection
        oauthEnabled={oauthEnabled}
        isClaimed={artist.is_claimed}
        instagramHandle={artist.instagram_handle}
        verificationMethod={artist.verification_method}
        accountType={artist.instagram_account_type}
        tokenExpiresAt={artist.instagram_token_expires_at}
      />

      <DangerSection isActive={artist.is_active} />
    </div>
  );
}

// ── Verification ────────────────────────────────────────────────────────────

function VerificationSection({
  oauthEnabled,
  isClaimed,
  instagramHandle,
  verificationMethod,
  accountType,
  tokenExpiresAt,
}: {
  oauthEnabled: boolean;
  isClaimed: boolean;
  instagramHandle: string;
  verificationMethod: "bio_code" | "instagram_oauth" | null;
  accountType: "BUSINESS" | "CREATOR" | "PERSONAL" | null;
  tokenExpiresAt: string | null;
}) {
  const [state, action, pending] = useActionState<DisconnectInstagramState, FormData>(
    disconnectInstagram,
    {},
  );

  const oauthConnected = verificationMethod === "instagram_oauth" && !!tokenExpiresAt;
  const expiresLabel = tokenExpiresAt
    ? new Date(tokenExpiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="space-y-4">
      <SectionEyebrow>Verification</SectionEyebrow>

      <div className="bg-surface border-hairline space-y-3 rounded-(--r-md) border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[15px] font-medium">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                width={16}
                height={16}
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              {oauthConnected ? (
                <span>
                  Connected as <span className="font-mono">@{instagramHandle}</span>
                </span>
              ) : isClaimed ? (
                <span>Verified by bio code</span>
              ) : (
                <span>Not verified</span>
              )}
            </div>
            <p className="text-dim mt-1 text-[13px] leading-normal">
              {oauthConnected
                ? `Instagram ${accountType?.toLowerCase() ?? "business"} account. Token refreshes automatically${expiresLabel ? ` (next renewal before ${expiresLabel})` : ""}.`
                : isClaimed
                  ? "You can upgrade to a stronger Instagram Business connection to skip future re-checks."
                  : "Verify ownership of your Instagram handle to claim this profile."}
            </p>
          </div>
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.14em] uppercase",
              oauthConnected || isClaimed ? "text-ink-spot" : "text-demo",
            )}
          >
            {oauthConnected ? "OAuth" : isClaimed ? "Bio code" : "Pending"}
          </span>
        </div>

        {state.error && <FieldError message={state.error} />}

        <div className="flex flex-wrap items-center gap-2">
          {oauthConnected ? (
            <form action={action}>
              <button
                type="submit"
                disabled={pending}
                className="text-faint hover:text-(--text) disabled:opacity-55 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors"
              >
                {pending ? "Disconnecting…" : "Disconnect Instagram"}
              </button>
            </form>
          ) : oauthEnabled && instagramHandle ? (
            <InstagramConnectButton
              next="/dashboard/profile"
              label={isClaimed ? "Upgrade to Instagram Business" : "Connect Instagram Business"}
              variant="secondary"
            />
          ) : !isClaimed ? (
            <a
              href="/onboarding/verify"
              className={cn(btnSecondaryClass, "inline-flex items-center justify-center gap-2")}
            >
              Verify with bio code
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ── Appearance ──────────────────────────────────────────────────────────────

function AppearanceSection({
  handle,
  displayName,
  avatarUrl,
  coverUrl,
}: {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}) {
  const [state, action, pending] = useActionState<UpdateAppearanceState, FormData>(
    updateAppearance,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(coverUrl);
  const [pendingAvatarRemove, setPendingAvatarRemove] = useState(false);
  const [pendingCoverRemove, setPendingCoverRemove] = useState(false);
  const initials = displayName.slice(0, 2).toUpperCase() || handle.slice(0, 2).toUpperCase();
  const dirty =
    pendingAvatarRemove ||
    pendingCoverRemove ||
    avatarPreview !== avatarUrl ||
    coverPreview !== coverUrl;

  function onFile(slot: "avatar" | "cover", file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (slot === "avatar") {
      setAvatarPreview(url);
      setPendingAvatarRemove(false);
    } else {
      setCoverPreview(url);
      setPendingCoverRemove(false);
    }
  }

  function markRemove(slot: "avatar" | "cover") {
    if (slot === "avatar") {
      setAvatarPreview(null);
      setPendingAvatarRemove(true);
    } else {
      setCoverPreview(null);
      setPendingCoverRemove(true);
    }
  }

  return (
    <section className="space-y-4">
      <SectionEyebrow>Appearance</SectionEyebrow>

      <form ref={formRef} action={action} className="space-y-5">
        <input
          type="hidden"
          name="remove_avatar"
          value={pendingAvatarRemove ? "true" : "false"}
        />
        <input type="hidden" name="remove_cover" value={pendingCoverRemove ? "true" : "false"} />

        {/* Cover */}
        <ImageSlot
          label="Cover image"
          hint="16:9, used as the banner on your profile."
          aspect="aspect-[16/7]"
          previewUrl={coverPreview}
          fallbackInitials={initials}
          name="cover"
          onFile={(f) => onFile("cover", f)}
          onRemove={() => markRemove("cover")}
          disabled={pending}
        />

        {/* Avatar */}
        <ImageSlot
          label="Profile photo"
          hint="Square crop, shown on cards and the dashboard."
          aspect="aspect-square w-32"
          previewUrl={avatarPreview}
          fallbackInitials={initials}
          name="avatar"
          onFile={(f) => onFile("avatar", f)}
          onRemove={() => markRemove("avatar")}
          disabled={pending}
          rounded="rounded-full"
        />

        {state.error && <FieldError message={state.error} />}
        {state.success && !dirty && <SavedHint />}

        <button type="submit" className={btnPrimaryClass} disabled={pending || !dirty}>
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden /> Uploading…
            </>
          ) : (
            <>
              <Upload size={14} aria-hidden /> Save images
            </>
          )}
        </button>
      </form>
    </section>
  );
}

function ImageSlot({
  label,
  hint,
  aspect,
  previewUrl,
  fallbackInitials,
  name,
  onFile,
  onRemove,
  disabled,
  rounded = "rounded-(--r-md)",
}: {
  label: string;
  hint: string;
  aspect: string;
  previewUrl: string | null;
  fallbackInitials: string;
  name: "avatar" | "cover";
  onFile: (file: File | null) => void;
  onRemove: () => void;
  disabled: boolean;
  rounded?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <div className={labelClass}>{label}</div>
        <div className="text-faint text-[11px]">{hint}</div>
      </div>

      <div className={cn("relative overflow-hidden bg-surface-2 border border-hairline", aspect, rounded)}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
            unoptimized={previewUrl.startsWith("blob:")}
          />
        ) : (
          <div
            aria-hidden
            className="text-faint absolute inset-0 flex items-center justify-center font-mono text-[36px] tracking-[0.04em] uppercase"
          >
            {fallbackInitials}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept="image/*"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="border-ds-border text-text-2 hover:bg-surface-2 disabled:opacity-55 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors"
        >
          <Upload size={11} aria-hidden /> {previewUrl ? "Replace" : "Upload"}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              onRemove();
            }}
            disabled={disabled}
            className="text-faint hover:text-(--text) disabled:opacity-55 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors"
          >
            <ImageOff size={11} aria-hidden /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ── Details ─────────────────────────────────────────────────────────────────

function DetailsSection({ artist }: { artist: ProfileFormProps["artist"] }) {
  const [state, action, pending] = useActionState<UpdateProfileState, FormData>(updateProfile, {});
  const [selectedStyles, setSelectedStyles] = useState<ArtistStyle[]>(artist.primary_styles ?? []);
  const [ig, setIg] = useState(artist.instagram_handle);

  const igChanged = ig !== artist.instagram_handle;
  const ownedAndVerified = artist.is_claimed && !!artist.instagram_handle;

  function toggleStyle(s: ArtistStyle) {
    setSelectedStyles((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= MAX_STYLES) return prev;
      return [...prev, s];
    });
  }

  return (
    <section className="space-y-4">
      <SectionEyebrow>Details</SectionEyebrow>

      <form action={action} className="space-y-5">
        {/* primary_styles is rendered as repeating hidden inputs so the
            Server Action can read formData.getAll("primary_styles"). */}
        {selectedStyles.map((s) => (
          <input key={s} type="hidden" name="primary_styles" value={s} />
        ))}

        <Field label="Studio name" required>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            defaultValue={artist.display_name}
            disabled={pending}
            className={inputClass}
          />
        </Field>

        <Field
          label="Instagram handle"
          hint={
            igChanged
              ? "Changing this will reset your verification."
              : ownedAndVerified
                ? "Verified."
                : "Optional. You'll be asked to verify with a bio code."
          }
        >
          <div className="relative">
            <span className="text-dim pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[14px]">
              @
            </span>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              value={ig}
              onChange={(e) => setIg(e.target.value)}
              maxLength={30}
              pattern="[a-zA-Z0-9_.]*"
              disabled={pending}
              className={cn(inputClass, "pl-8")}
              placeholder="yourstudio"
            />
          </div>
        </Field>

        <Field label="Bio" hint="Max 200 characters.">
          <textarea
            id="bio"
            name="bio"
            maxLength={200}
            rows={3}
            defaultValue={artist.bio}
            disabled={pending}
            className={cn(inputClass, "resize-none leading-normal")}
            placeholder="Blackwork and dotwork based in Santa Teresa…"
          />
        </Field>

        <Field label="Primary styles" hint={`Pick up to ${MAX_STYLES}.`}>
          <div className={cn(filterBarClass, "mx-[-2px] px-0!")}>
            {ALL_STYLES.map((s) => {
              const active = selectedStyles.includes(s);
              const atCap = !active && selectedStyles.length >= MAX_STYLES;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStyle(s)}
                  disabled={pending || atCap}
                  className={cn(
                    active ? chipActiveClass : chipClass,
                    "transition-colors",
                    atCap && "cursor-not-allowed opacity-50",
                  )}
                >
                  {STYLE_LABELS[s]}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Years of experience">
            <input
              id="years_experience"
              name="years_experience"
              type="number"
              min={0}
              max={60}
              defaultValue={artist.years_experience ?? ""}
              disabled={pending}
              className={inputClass}
              placeholder="5"
            />
          </Field>
          <Field label="Contact email">
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={artist.contact_email}
              disabled={pending}
              className={inputClass}
              placeholder="bookings@yourstudio.com"
            />
          </Field>
        </div>

        <Field label="Website" hint="Include https://">
          <input
            id="website_url"
            name="website_url"
            type="url"
            defaultValue={artist.website_url}
            disabled={pending}
            className={inputClass}
            placeholder="https://yourstudio.com"
          />
        </Field>

        {state.error && <FieldError message={state.error} />}
        {state.success && <SavedHint />}

        <button type="submit" className={btnPrimaryClass} disabled={pending}>
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </form>
    </section>
  );
}

// ── Danger zone ─────────────────────────────────────────────────────────────

function DangerSection({ isActive }: { isActive: boolean }) {
  const [state, action] = useActionState<ToggleActiveState, FormData>(setProfileActive, {});
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function submit(next: boolean) {
    const fd = new FormData();
    fd.set("is_active", String(next));
    startTransition(() => action(fd));
    setConfirming(false);
  }

  return (
    <section className="space-y-4 border-t border-hairline pt-7">
      <SectionEyebrow>Visibility</SectionEyebrow>

      <div className="bg-surface border-hairline space-y-3 rounded-(--r-md) border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[15px] font-medium">
              {isActive ? "Your profile is live" : "Your profile is hidden"}
            </div>
            <p className="text-dim mt-1 text-[13px] leading-normal">
              {isActive
                ? "Visitors can find you in Explore and visit your public page."
                : "You won't appear in Explore. Your page returns a not-found until you reactivate."}
            </p>
          </div>
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.14em] uppercase",
              isActive ? "text-ink-spot" : "text-demo",
            )}
          >
            {isActive ? "Live" : "Hidden"}
          </span>
        </div>

        {state.error && <FieldError message={state.error} />}

        {isActive ? (
          confirming ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={isPending}
                className={cn(btnSecondaryMd, "flex-1")}
              >
                {isPending ? "Hiding…" : "Yes, hide my profile"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="text-dim hover:text-(--text) inline-flex h-10 items-center gap-1.5 px-3 font-mono text-[10px] tracking-[0.14em] uppercase"
              >
                <X size={12} aria-hidden /> Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-faint hover:text-(--text) inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors"
            >
              Hide my profile
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={isPending}
            className={btnSecondaryMd}
          >
            {isPending ? "Reactivating…" : "Reactivate profile"}
          </button>
        )}
      </div>
    </section>
  );
}

// ── Atoms ───────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className={labelClass}>
          {label}
          {required && <span className="ml-1 text-[#f87171]">*</span>}
        </div>
        {hint && <div className="text-faint text-[11px] leading-[1.4]">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">{children}</div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="m-0 text-[13px] text-[#f87171]">{message}</p>;
}

function SavedHint() {
  return (
    <p className="text-ink-spot m-0 inline-flex items-center gap-1.5 text-[13px]">
      <CheckCircle2 size={14} aria-hidden /> Saved.
    </p>
  );
}
