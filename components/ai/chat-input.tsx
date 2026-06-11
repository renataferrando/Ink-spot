"use client";

import { ArrowUp } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (value: string) => void;
}

export function ChatInput({ placeholder, disabled, onSubmit }: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const value = inputRef.current?.value.trim();
    if (!value || disabled) return;
    onSubmit(value);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="border-hairline flex items-center gap-2 border-t px-3.5 py-3">
      <input
        ref={inputRef}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="placeholder:text-faint disabled:text-dim h-8 flex-1 border-0 bg-transparent text-[14px] outline-none"
      />
      <button
        type="button"
        aria-label="Send"
        disabled={disabled}
        onClick={handleSubmit}
        className="bg-ink-spot flex size-8 cursor-pointer items-center justify-center rounded-full border-0 text-(--accent-ink) transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
      >
        <ArrowUp size={14} aria-hidden />
      </button>
    </div>
  );
}
