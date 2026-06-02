import { useCallback, useEffect, useMemo, useState } from "react";
import { SourceEditor } from "./Editor";
import { RichEditor } from "./RichEditor";
import { DocumentPayload, NativeEnvelope, sendToNative } from "./native";
import { renderMarkdown } from "./markdown";
import { analyzeRichEditing } from "./richMarkdown";
import { Check, Clipboard, FileText, FolderOpen, PencilLine, RefreshCw, Save } from "lucide-react";
import "highlight.js/styles/github.css";
import "./styles.css";

type Mode = "view" | "rich" | "source";

const emptyDocument: DocumentPayload = {
  fileName: "Untitled.md",
  path: "",
  baseURL: "",
  text: "",
  dirty: false
};

export function App() {
  const [document, setDocument] = useState<DocumentPayload>(emptyDocument);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("view");
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    window.markUpNativeReceive = (message: NativeEnvelope) => {
      if (message.type === "loadDocument") {
        setDocument(message.payload);
        setText(message.payload.text);
        setDirty(message.payload.dirty);
        setConflict(false);
        setMode("view");
      }

      if (message.type === "saved") {
        setText(message.payload.text);
        setDocument((current) => ({ ...current, text: message.payload.text, dirty: false }));
        setDirty(false);
        setConflict(false);
      }

      if (message.type === "externalChange") {
        setConflict(true);
      }
    };

    sendToNative({ type: "ready" });
  }, []);

  const rendered = useMemo(() => renderMarkdown(text, document.baseURL), [text, document.baseURL]);

  const updateText = useCallback(
    (nextText: string) => {
      setText(nextText);
      const nextDirty = nextText !== document.text;
      setDirty(nextDirty);
      sendToNative({ type: "textChanged", text: nextText });
    },
    [document.text]
  );

  const save = useCallback(() => {
    sendToNative({ type: "textChanged", text });
    sendToNative({ type: "save" });
  }, [text]);

  const done = useCallback(() => {
    save();
    setMode("view");
  }, [save]);

  const handleRenderedClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest("a");
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute("href") || anchor.getAttribute("data-markup-link");
    if (!href) {
      return;
    }

    event.preventDefault();
    sendToNative({ type: "openExternal", url: href });
  }, []);

  const openEditor = useCallback(() => {
    setMode(analyzeRichEditing(text).supported ? "rich" : "source");
  }, [text]);

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="file-identity">
          <div className="file-icon" aria-hidden="true">
            <FileText size={16} />
          </div>
          <div className="file-metadata">
            <div className="file-name">{document.fileName}</div>
            <div className="file-path">{document.path}</div>
          </div>
        </div>
        <div className="toolbar">
          {dirty && <span className="dirty-indicator">Unsaved</span>}
          {mode === "view" ? (
            <button className="primary-action" onClick={openEditor}>
              <PencilLine size={15} />
              Edit
            </button>
          ) : (
            <>
              <div className="mode-switch" role="group" aria-label="Editing mode">
                <button className={mode === "rich" ? "active" : ""} onClick={() => setMode("rich")}>
                  Rich
                </button>
                <button className={mode === "source" ? "active" : ""} onClick={() => setMode("source")}>
                  Source
                </button>
              </div>
              <button className="command-button" onClick={save}>
                <Save size={15} />
                Save
              </button>
              <button className="primary" onClick={done}>
                <Check size={15} />
                Done
              </button>
            </>
          )}
          <span className="toolbar-divider" />
          <button className="toolbar-button" title="Reload from disk" aria-label="Reload from disk" onClick={() => sendToNative({ type: "reload" })}>
            <RefreshCw size={15} />
            Reload
          </button>
          <button className="toolbar-button" title="Reveal in Finder" aria-label="Reveal in Finder" onClick={() => sendToNative({ type: "reveal" })}>
            <FolderOpen size={15} />
            Show in Finder
          </button>
          <button className="toolbar-button" title="Copy path" aria-label="Copy path" onClick={() => sendToNative({ type: "copyPath" })}>
            <Clipboard size={15} />
            Copy Path
          </button>
        </div>
      </header>

      {conflict && (
        <div className="conflict-bar">
          <span>This file changed on disk while you have edits.</span>
          <button className="command-button" onClick={() => setConflict(false)}>Keep Mine</button>
          <button className="command-button" onClick={() => sendToNative({ type: "reload" })}>Reload Theirs</button>
        </div>
      )}

      {mode === "view" ? (
        <div className="viewer-scroll" onClick={handleRenderedClick}>
          <article className="viewer" dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>
      ) : mode === "rich" ? (
        <RichEditor
          text={text}
          onChange={updateText}
          onSave={save}
          onDone={done}
          onSourceFallback={() => setMode("source")}
        />
      ) : (
        <SourceEditor text={text} onChange={updateText} onSave={save} onDone={done} />
      )}
    </div>
  );
}
