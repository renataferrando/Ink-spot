"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";

import { createProfile, type CreateProfileState } from "@/actions/artist/create-profile";

const inputStyle = (focused: boolean, disabled: boolean): React.CSSProperties => ({
  width: "100%",
  background: "var(--surface-2)",
  border: `1px solid ${focused ? "var(--accent)" : "var(--hairline)"}`,
  boxShadow: focused ? "0 0 0 3px var(--accent-soft)" : "none",
  borderRadius: "var(--r-md)",
  padding: "14px 16px",
  fontSize: 15,
  color: "var(--text)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  opacity: disabled ? 0.55 : 1,
});

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 8,
};

function FocusInput({
  id,
  name,
  placeholder,
  required,
  minLength,
  maxLength,
  disabled,
  type,
}: {
  id: string;
  name: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  disabled: boolean;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      name={name}
      type={type ?? "text"}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      maxLength={maxLength}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputStyle(focused, disabled)}
    />
  );
}

export function OnboardingForm() {
  const [state, action, pending] = useActionState<CreateProfileState, FormData>(createProfile, {});
  const [igFocused, setIgFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Studio name */}
      <div>
        <div style={labelStyle}>
          <label htmlFor="studio_name" className="label">
            Studio name
          </label>
          <span style={{ color: "#f87171", fontSize: 10 }}>*</span>
        </div>
        <FocusInput
          id="studio_name"
          name="studio_name"
          placeholder="Luna Negra Studio"
          required
          minLength={2}
          maxLength={100}
          disabled={pending}
        />
      </div>

      {/* Instagram handle */}
      <div>
        <div style={labelStyle}>
          <label htmlFor="instagram_handle" className="label">
            Instagram handle
          </label>
          <span
            style={{
              fontFamily: "var(--font-jetbrains, ui-monospace)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            (optional)
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-jetbrains, ui-monospace)",
              fontSize: 14,
              color: "var(--dim)",
              pointerEvents: "none",
            }}
          >
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
            onFocus={() => setIgFocused(true)}
            onBlur={() => setIgFocused(false)}
            style={{ ...inputStyle(igFocused, pending), paddingLeft: 32 }}
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--faint)", margin: "6px 0 0", lineHeight: 1.5 }}>
          We&apos;ll ask you to verify this with a quick bio code.
        </p>
      </div>

      {/* Bio */}
      <div>
        <div style={labelStyle}>
          <label htmlFor="bio" className="label">
            Short bio
          </label>
          <span
            style={{
              fontFamily: "var(--font-jetbrains, ui-monospace)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            (optional, max 200)
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          placeholder="Blackwork and dotwork based in Santa Teresa…"
          maxLength={200}
          rows={3}
          disabled={pending}
          onFocus={() => setBioFocused(true)}
          onBlur={() => setBioFocused(false)}
          style={{
            ...inputStyle(bioFocused, pending),
            resize: "none",
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Years of experience */}
      <div>
        <div style={labelStyle}>
          <label htmlFor="years_experience" className="label">
            Years of experience
          </label>
          <span
            style={{
              fontFamily: "var(--font-jetbrains, ui-monospace)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            (optional)
          </span>
        </div>
        <FocusInput
          id="years_experience"
          name="years_experience"
          type="number"
          placeholder="5"
          disabled={pending}
        />
      </div>

      {state.error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{state.error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? (
          "Creating profile…"
        ) : (
          <>
            <span>Continue</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
