import { useEffect, useRef } from "react";
import { basicSetup, EditorView } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { keymap } from "@codemirror/view";

type SourceEditorProps = {
  text: string;
  onChange: (text: string) => void;
  onSave: () => void;
  onDone: () => void;
};

export function SourceEditor({ text, onChange, onSave, onDone }: SourceEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const latestCallbacks = useRef({ onChange, onSave, onDone });

  latestCallbacks.current = { onChange, onSave, onDone };

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const view = new EditorView({
      doc: text,
      parent: hostRef.current,
      extensions: [
        basicSetup,
        markdown(),
        EditorView.lineWrapping,
        keymap.of([
          {
            key: "Mod-s",
            preventDefault: true,
            run() {
              latestCallbacks.current.onSave();
              return true;
            }
          },
          {
            key: "Mod-e",
            preventDefault: true,
            run() {
              latestCallbacks.current.onDone();
              return true;
            }
          }
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            latestCallbacks.current.onChange(update.state.doc.toString());
          }
        })
      ]
    });

    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const current = view.state.doc.toString();
    if (current !== text) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: text }
      });
    }
  }, [text]);

  return <div className="source-editor" ref={hostRef} />;
}
