"use client";

import { useEffect, useRef, useState } from "react";

interface StreamingTextProps {
  stream: ReadableStream<Uint8Array> | null;
  onToken?: (text: string) => void;
  onDone?: () => void;
  className?: string;
}

export function StreamingText({ stream, onToken, onDone, className }: StreamingTextProps) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    if (!stream) return;
    setText("");
    setDone(false);

    const reader = stream.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = "";

    (async () => {
      try {
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as { type: string; text?: string };
              if (event.type === "token" && event.text) {
                setText((prev) => prev + event.text);
                onToken?.(event.text!);
              } else if (event.type === "done") {
                setDone(true);
                onDone?.();
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    })();

    return () => {
      reader.cancel().catch(() => {});
    };
  }, [stream, onToken, onDone]);

  return (
    <span className={className}>
      {text}
      {!done && text && (
        <span
          aria-hidden
          className="bg-ink-spot ml-0.5 inline-block h-[1em] w-1.5 animate-[blink_1s_steps(1)_infinite] align-middle"
        />
      )}
    </span>
  );
}
