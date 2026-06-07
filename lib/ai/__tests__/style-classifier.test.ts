import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @anthropic-ai/sdk before importing the module under test ─────────────
const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  function Anthropic() {
    return { messages: { create: mockCreate } };
  }
  return {
    ...actual,
    default: Anthropic,
  };
});

// ── Mock env so ANTHROPIC_API_KEY is available ────────────────────────────────
vi.mock("@/lib/validations/env", () => ({
  env: { ANTHROPIC_API_KEY: "test-key" },
}));

import { classifyStyle } from "../style-classifier";

function makeResponse(text: string, inputTokens = 800, outputTokens = 80) {
  return {
    content: [{ type: "text", text }],
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  };
}

describe("classifyStyle", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns catalog styles from a valid model response", async () => {
    mockCreate.mockResolvedValueOnce(
      makeResponse(
        JSON.stringify({
          styles: ["blackwork", "dotwork"],
          confidence: 0.92,
          description: "Dense blackwork fill with dotwork shading.",
        }),
      ),
    );

    const result = await classifyStyle("https://example.com/tattoo.jpg");

    expect(result.styles).toEqual(["blackwork", "dotwork"]);
    expect(result.confidence).toBeCloseTo(0.92);
    expect(result.description).toContain("blackwork");
  });

  it("filters out non-catalog styles silently", async () => {
    mockCreate.mockResolvedValueOnce(
      makeResponse(
        JSON.stringify({
          styles: ["blackwork", "photorealism", "fine-line"],
          confidence: 0.8,
          description: "Mixed styles.",
        }),
      ),
    );

    const result = await classifyStyle("https://example.com/tattoo2.jpg");

    expect(result.styles).toEqual(["blackwork", "fine-line"]);
    expect(result.styles).not.toContain("photorealism");
  });

  it("throws when the model returns no valid catalog styles", async () => {
    mockCreate.mockResolvedValueOnce(
      makeResponse(
        JSON.stringify({
          styles: ["abstract", "surrealism"],
          confidence: 0.5,
          description: "Unknown styles.",
        }),
      ),
    );

    await expect(classifyStyle("https://example.com/tattoo3.jpg")).rejects.toThrow(
      "no valid catalog styles",
    );
  });

  it("throws on invalid JSON from the model", async () => {
    mockCreate.mockResolvedValueOnce(makeResponse("not json at all"));

    await expect(classifyStyle("https://example.com/tattoo4.jpg")).rejects.toThrow(
      "invalid JSON",
    );
  });

  it("clamps confidence to [0, 1]", async () => {
    mockCreate.mockResolvedValueOnce(
      makeResponse(
        JSON.stringify({
          styles: ["realism"],
          confidence: 1.5,
          description: "High-detail realism.",
        }),
      ),
    );

    const result = await classifyStyle("https://example.com/tattoo5.jpg");
    expect(result.confidence).toBe(1);
  });

  it("defaults confidence to 0.5 when missing from response", async () => {
    mockCreate.mockResolvedValueOnce(
      makeResponse(
        JSON.stringify({
          styles: ["geometric"],
          description: "Clean geometric lines.",
        }),
      ),
    );

    const result = await classifyStyle("https://example.com/tattoo6.jpg");
    expect(result.confidence).toBe(0.5);
  });
});
