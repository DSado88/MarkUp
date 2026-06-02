import { describe, expect, test } from "vitest";
import { analyzeRichEditing, bodyForRichEditing, composeRichMarkdown } from "../src/richMarkdown";

describe("rich markdown guardrails", () => {
  test("allows common Markdown used by repo docs", () => {
    const result = analyzeRichEditing("# Title\n\n- item\n\n| A | B |\n|---|---|\n| 1 | 2 |\n");

    expect(result.supported).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  test("keeps frontmatter out of the rich editor body", () => {
    const source = "---\ntitle: Test\n---\n\n# Body\n";

    expect(bodyForRichEditing(source)).toBe("\n# Body\n");
    expect(composeRichMarkdown(source, "\n# Changed\n")).toBe("---\ntitle: Test\n---\n\n# Changed\n");
  });

  test("routes unsupported Markdown to source editing", () => {
    const result = analyzeRichEditing("# Title\n\n:::note\nWatch this\n:::\n\n[[Wiki]]\n");

    expect(result.supported).toBe(false);
    expect(result.reasons).toContain("directives/admonitions");
    expect(result.reasons).toContain("wikilinks");
  });

  test("routes likely lossy inline Markdown to source editing", () => {
    const result = analyzeRichEditing("Title\n=====\n\nUse <kbd>Cmd</kbd>  \nnext\n");

    expect(result.supported).toBe(false);
    expect(result.reasons).toContain("setext headings");
    expect(result.reasons).toContain("inline HTML");
    expect(result.reasons).toContain("hard line breaks");
  });

  test("does not flag unsupported syntax inside code fences", () => {
    const result = analyzeRichEditing("```md\n:::note\n[[Wiki]]\n```\n");

    expect(result.supported).toBe(true);
  });

  test("does not flag generics/angle brackets inside inline code", () => {
    const result = analyzeRichEditing(
      "- each exports `build<Provider>RunOptions`.\n- a `Set<ProgressListener>`; tools emit.\n"
    );

    expect(result.reasons).not.toContain("inline HTML");
    expect(result.supported).toBe(true);
  });
});
