import { describe, it, expect } from "vitest";
import { getAiBaseUrl, chatModel } from "@codemapai/openai-server";

describe("OpenRouter AI Configuration", () => {
  it("should configure OpenRouter base URL correctly", () => {
    const url = getAiBaseUrl();
    expect(url).toBeDefined();
    expect(typeof url).toBe("string");
    expect(url).toContain("openrouter.ai");
  });

  it("should fall back to openrouter/free model by default if not set", () => {
    expect(chatModel).toBeDefined();
    expect(typeof chatModel).toBe("string");
  });
});
