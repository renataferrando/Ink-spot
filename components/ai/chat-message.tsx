"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function ChatMessage({ role, content, streaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[15px] leading-[1.5]",
          isUser
            ? "bg-ink-spot text-(--accent-ink)"
            : "bg-surface-2 border-hairline border text-(--text)",
        )}
      >
        {content}
        {streaming && (
          <span
            aria-hidden
            className="bg-ink-spot ml-0.5 inline-block h-[1em] w-1.5 animate-[blink_1s_steps(1)_infinite] align-middle"
          />
        )}
      </div>
    </div>
  );
}
