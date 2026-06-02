# MarkUp

A native macOS Markdown editor that wraps a fast TypeScript/React editing surface in a Swift document-based app. Open a `.md` file, read it as clean rendered HTML, then drop into rich (WYSIWYG) or raw source editing.

## Features

- **Three modes** — *View* (rendered preview), *Rich* (WYSIWYG via [Tiptap](https://tiptap.dev)), and *Source* (CodeMirror).
- **Safe rich editing** — when a file contains Markdown that rich mode can't round-trip losslessly (raw HTML, MDX, directives, footnotes, wikilinks, etc.), the editor pauses rich mode and points you to source editing instead of silently mangling the file.
- **Live on disk** — watches the open file and warns on external changes so you don't clobber edits made elsewhere.
- **Sanitized rendering** — HTML is sanitized with DOMPurify; remote images are blocked by default.
- **Native niceties** — reveal in Finder, copy path, reload from disk, syntax-highlighted code blocks, GFM tables, task lists, and frontmatter handling.

## Requirements

- macOS 14+
- Swift 6 toolchain (Xcode 16 / command-line tools)
- Node.js 18+ (for the web bundle)

## Build & run

```bash
# Builds the web bundle, compiles the Swift app, and assembles MarkUp.app
./scripts/build_app.sh
open build/MarkUp.app
```

### Web development

The editing surface lives in `web/`:

```bash
cd web
npm install
npm run dev    # Vite dev server
npm test       # Vitest unit tests
```

By default the native app loads the bundled web assets from inside `MarkUp.app`. To point it at a live dev build instead, set `MARKUP_WEB_ROOT` to a directory containing `index.html`.

## Architecture

| Layer | Path | Role |
|-------|------|------|
| Native shell | `Sources/MarkUp` | Document controller, window, `WKWebView` host, file watching |
| Shared core | `Sources/MarkUpCore` | Markdown buffer model |
| Web editor | `web/src` | React UI, markdown-it rendering, Tiptap rich editor, CodeMirror source editor |

The Swift layer hosts a `WKWebView` and exchanges messages with the web app (load document, save, reveal, reload). The web app owns all editing and rendering.

## License

No license yet — all rights reserved by the author.
