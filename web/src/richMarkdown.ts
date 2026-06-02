import { splitFrontmatter } from "./markdown";

export type RichAnalysis = {
  supported: boolean;
  reasons: string[];
};

const unsupportedLineRules: Array<[RegExp, string]> = [
  [/^\s*:::/, "directives/admonitions"],
  [/^\s*\$\$\s*$/, "math blocks"],
  [/^\s*(import|export)\s.+from\s+["']/, "MDX imports/exports"],
  [/^\s*<[A-Z][\w.:-]*(\s|>|\/>)/, "MDX components"],
  [/^\s*<script\b/i, "script HTML"],
  [/^\s*<iframe\b/i, "iframe HTML"]
];

export function analyzeRichEditing(source: string): RichAnalysis {
  const { body } = splitFrontmatter(source);
  const reasons = new Set<string>();
  let inFence = false;
  let previousContentLine = "";

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      previousContentLine = "";
      continue;
    }

    if (inFence) {
      continue;
    }

    if (previousContentLine.trim() && /^\s*(=+|-+)\s*$/.test(line)) {
      reasons.add("setext headings");
    }

    if (/\S {2,}$/.test(line)) {
      reasons.add("hard line breaks");
    }

    if (line.includes("[[")) {
      reasons.add("wikilinks");
    }

    if (/^\[\^[^\]]+\]:/.test(line) || /\[\^[^\]]+\]/.test(line)) {
      reasons.add("footnotes");
    }

    if (/^\s*\[[^\]]+\]:\s+\S+/.test(line)) {
      reasons.add("reference-style links");
    }

    // Angle brackets inside inline code (e.g. `Set<T>`, `build<Provider>Foo`)
    // are not HTML, so strip code spans before scanning for HTML.
    const htmlLine = line.replace(/(`+)[\s\S]*?\1/g, "");

    if (/<!--/.test(htmlLine)) {
      reasons.add("HTML comments");
    }

    if (/^\s*<([a-z][\w-]*)(\s|>|\/>)/i.test(htmlLine)) {
      reasons.add("raw HTML blocks");
    }

    if (/<[A-Za-z][\w.:-]*(\s|>|\/)/.test(htmlLine)) {
      reasons.add("inline HTML");
    }

    for (const [rule, reason] of unsupportedLineRules) {
      if (rule.test(line)) {
        reasons.add(reason);
      }
    }

    if (line.trim()) {
      previousContentLine = line;
    } else {
      previousContentLine = "";
    }
  }

  return {
    supported: reasons.size === 0,
    reasons: [...reasons]
  };
}

export function bodyForRichEditing(source: string) {
  return splitFrontmatter(source).body;
}

export function composeRichMarkdown(originalSource: string, editedBody: string) {
  const { frontmatter } = splitFrontmatter(originalSource);
  return frontmatter ? `${frontmatter}${editedBody}` : editedBody;
}
