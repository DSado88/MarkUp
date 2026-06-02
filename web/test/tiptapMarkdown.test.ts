import { Editor } from "@tiptap/core";
import { describe, expect, test } from "vitest";
import { editorExtensions } from "../src/tiptapExtensions";

describe("Tiptap Markdown bridge", () => {
  test("keeps relative links relative when serializing rich content", () => {
    const editor = new Editor({
      extensions: editorExtensions,
      content: "| # | Map |\n|---|-----|\n| 01 | [LOC](01-loc.md) |\n",
      contentType: "markdown"
    });

    const markdown = editor.getMarkdown();
    editor.destroy();

    expect(markdown).toContain("[LOC](01-loc.md)");
    expect(markdown).not.toContain("file://");
  });

  test("serializes a rich text edit back to Markdown", () => {
    const editor = new Editor({
      extensions: editorExtensions,
      content: "# Title\n\nBody\n",
      contentType: "markdown"
    });

    editor.chain().focus().setTextSelection({ from: 8, to: 13 }).toggleBold().run();
    const markdown = editor.getMarkdown();
    editor.destroy();

    expect(markdown).toContain("**Body**");
  });
});
