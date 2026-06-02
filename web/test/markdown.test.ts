import { describe, expect, test } from "vitest";
import { renderMarkdown, splitFrontmatter } from "../src/markdown";

describe("renderMarkdown", () => {
  test("renders GFM-style tables as real tables", () => {
    const html = renderMarkdown("| # | Map |\n|---|-----|\n| 01 | LOC |\n", "");

    expect(html).toContain("<table>");
    expect(html).toContain("<td>01</td>");
  });

  test("blocks remote images by default", () => {
    const html = renderMarkdown("![pixel](https://example.com/pixel.png)", "");

    expect(html).toContain("Remote image blocked");
    expect(html).not.toContain("src=\"https://example.com/pixel.png\"");
  });

  test("sanitizes script tags and event handlers", () => {
    const html = renderMarkdown("<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>", "");

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("onerror");
  });

  test("preserves frontmatter as a visible metadata strip", () => {
    const html = renderMarkdown("---\ntitle: Test\n---\n\n# Body\n", "");

    expect(html).toContain("Frontmatter");
    expect(html).toContain("title: Test");
    expect(html).toContain("<h1>Body</h1>");
  });
});

describe("splitFrontmatter", () => {
  test("splits yaml frontmatter without mutating text", () => {
    const source = "---\ntitle: Test\n---\n\n# Body\n";
    const split = splitFrontmatter(source);

    expect(split.frontmatter).toBe("---\ntitle: Test\n---\n");
    expect(split.body).toBe("\n# Body\n");
  });

  test("supports CRLF frontmatter", () => {
    const source = "---\r\ntitle: Test\r\n---\r\n\r\n# Body\r\n";
    const split = splitFrontmatter(source);

    expect(split.frontmatter).toBe("---\r\ntitle: Test\r\n---\r\n");
    expect(split.body).toBe("\r\n# Body\r\n");
  });

  test("supports frontmatter at EOF without trailing newline", () => {
    const source = "---\ntitle: Test\n---";
    const split = splitFrontmatter(source);

    expect(split.frontmatter).toBe(source);
    expect(split.body).toBe("");
  });
});
