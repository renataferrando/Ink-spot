"use client";

import { useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ArtistQAPanelProps {
  handle: string;
  displayName: string;
}

const SUGGESTIONS = [
  "¿Viaja para trabajar con clientes?",
  "¿Disponibilidad este mes?",
  "¿Hace cover-ups?",
  "¿Rango de precios?",
];

export function ArtistQAPanel({ handle, displayName }: ArtistQAPanelProps) {
  const [history, setHistory] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const answerRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    if (streaming) return;

    setHistory((prev) => [...prev, { role: "user", content: question }]);
    setStreaming(true);
    setStreamingText("");

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`/api/ai/artist-qa/${handle}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: history.slice(-10),
        }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      answerRef.current = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as { type: string; text?: string };
            if (event.type === "token" && event.text) {
              answerRef.current += event.text;
              setStreamingText(answerRef.current);
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            } else if (event.type === "done") {
              setHistory((prev) => [...prev, { role: "assistant", content: answerRef.current }]);
              setStreamingText("");
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: "No pude obtener una respuesta. Intenta de nuevo." },
        ]);
      }
      setStreamingText("");
    } finally {
      setStreaming(false);
    }
  }

  const firstName = displayName.trim().split(/\s+/)[0];

  return (
    <div className="bg-surface border-hairline mx-[18px] mt-8 mb-8 overflow-hidden rounded-[18px] border">
      {/* Header */}
      <div className="border-hairline flex items-center justify-between border-b px-[18px] py-4">
        <div className="flex items-center gap-2.5">
          <div className="after:bg-ink-spot relative size-6 rounded-full bg-[radial-gradient(circle,var(--accent)_0%,transparent_70%)] after:absolute after:inset-2 after:rounded-full after:content-['']" />
          <div className="text-[17px]">Pregunta sobre {firstName}</div>
        </div>
        <div className="text-ink-spot border-hairline rounded-full border px-2 py-1 font-mono text-[9px] tracking-[0.14em] uppercase">
          AI · Beta
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`flex flex-col gap-3 px-[18px] py-4 ${history.length > 0 || streaming ? "min-h-[80px]" : "min-h-24 items-center justify-center"}`}
      >
        {history.length === 0 && !streaming && (
          <div className="text-dim font-mono text-[13px] tracking-[0.08em] uppercase">
            Haz una pregunta sobre el trabajo de {firstName}
          </div>
        )}
        {history.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {streaming && streamingText && (
          <ChatMessage role="assistant" content={streamingText} streaming />
        )}
      </div>

      {/* Suggestions (only when no history) */}
      {history.length === 0 && !streaming && (
        <div className="flex flex-wrap gap-1.5 px-[18px] pb-3.5">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="text-text-2 border-hairline cursor-pointer rounded-full border bg-transparent px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] transition-colors hover:border-ink-spot/50 hover:text-(--text)"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput
        placeholder={`Pregunta sobre el trabajo, estilo, disponibilidad de ${firstName}…`}
        disabled={streaming}
        onSubmit={ask}
      />
    </div>
  );
}
