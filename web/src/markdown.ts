import DOMPurify from "dompurify";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";
import markdownItTaskLists from "markdown-it-task-lists";

type FrontmatterSplit = {
  frontmatter: string | null;
  body: string;
};

const remoteImagePattern = /^https?:\/\//i;

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  highlight(code, language) {
    const lang = language && hljs.getLanguage(language) ? language : "plaintext";
    const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    return `<pre class="hljs"><code>${highlighted}</code></pre>`;
  }
})
  .use(markdownItFootnote)
  .use(markdownItTaskLists, { enabled: false, label: true });

const defaultImageRenderer =
  md.renderer.rules.image ??
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet("src") ?? "";

  if (remoteImagePattern.test(src)) {
    token.attrSet("src", "");
    token.attrSet("alt", `${token.content || src} (remote image blocked)`);
    token.attrJoin("class", "blocked-remote-image");
    token.attrSet("data-blocked-src", src);
    return `<span class="remote-image-placeholder">Remote image blocked: ${escapeHtml(src)}</span>`;
  }

  if (env.baseURL && src && !/^[a-z]+:/i.test(src)) {
    try {
      token.attrSet("src", new URL(src, env.baseURL).toString());
    } catch {
      token.attrSet("src", src);
    }
  }

  return defaultImageRenderer(tokens, idx, options, env, self);
};

const defaultLinkOpenRenderer =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet("href") ?? "";

  if (env.baseURL && href && !/^[a-z]+:/i.test(href) && !href.startsWith("#")) {
    try {
      token.attrSet("href", new URL(href, env.baseURL).toString());
    } catch {
      token.attrSet("href", href);
    }
  }

  token.attrSet("data-markup-link", token.attrGet("href") ?? href);
  return defaultLinkOpenRenderer(tokens, idx, options, env, self);
};

md.renderer.rules.table_open = () => '<div class="table-scroll"><table>';
md.renderer.rules.table_close = () => "</table></div>";

export function renderMarkdown(source: string, baseURL: string) {
  const split = splitFrontmatter(source);
  const rendered = md.render(split.body, { baseURL });
  const frontmatter = split.frontmatter ? renderFrontmatter(split.frontmatter) : "";
  const dirtyHtml = `${frontmatter}<main class="markdown-body">${rendered}</main>`;

  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["srcdoc"],
    ADD_ATTR: ["data-markup-link", "data-blocked-src", "class"]
  });
}

export function splitFrontmatter(source: string): FrontmatterSplit {
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
    return { frontmatter: null, body: source };
  }

  const newline = source.startsWith("---\r\n") ? "\r\n" : "\n";
  const closing = `${newline}---${newline}`;
  const closeIndex = source.indexOf(closing, 3);

  if (closeIndex !== -1) {
    const end = closeIndex + closing.length;
    return {
      frontmatter: source.slice(0, end),
      body: source.slice(end)
    };
  }

  const eofClosing = `${newline}---`;
  if (!source.endsWith(eofClosing)) {
    return { frontmatter: null, body: source };
  }

  return {
    frontmatter: source,
    body: ""
  };
}

function renderFrontmatter(source: string) {
  const content = source
    .replace(/^---\r?\n/, "")
    .replace(/\r?\n---\r?\n$/, "")
    .trim();

  return `<details class="frontmatter"><summary>Frontmatter</summary><pre>${escapeHtml(content)}</pre></details>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
