import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Plus,
  Quote,
  Rows3,
  Table2,
  Trash2
} from "lucide-react";
import { analyzeRichEditing, bodyForRichEditing, composeRichMarkdown } from "./richMarkdown";
import { editorExtensions } from "./tiptapExtensions";

type RichEditorProps = {
  text: string;
  onChange: (text: string) => void;
  onSave: () => void;
  onDone: () => void;
  onSourceFallback: () => void;
};

export function RichEditor({ text, onChange, onSave, onDone, onSourceFallback }: RichEditorProps) {
  const analysis = useMemo(() => analyzeRichEditing(text), [text]);
  const richBody = useMemo(() => bodyForRichEditing(text), [text]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const latestState = useRef({ text, onChange, onSave, onDone });

  latestState.current = { text, onChange, onSave, onDone };

  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: richBody,
      contentType: "markdown",
      editorProps: {
        handleKeyDown(_, event) {
          if (event.key === "/") {
            setShowSlashMenu(true);
          }

          if (event.key === "Escape") {
            setShowSlashMenu(false);
          }

          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            latestState.current.onSave();
            return true;
          }

          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
            event.preventDefault();
            latestState.current.onDone();
            return true;
          }

          return false;
        }
      },
      onUpdate({ editor }) {
        const latest = latestState.current;
        latest.onChange(composeRichMarkdown(latest.text, editor.getMarkdown()));
      }
    },
    [analysis.supported]
  );

  useEffect(() => {
    if (!editor || !analysis.supported) {
      return;
    }

    const currentMarkdown = editor.getMarkdown();
    if (currentMarkdown !== richBody) {
      editor.commands.setContent(richBody, { contentType: "markdown", emitUpdate: false });
    }
  }, [editor, richBody, analysis.supported]);

  if (!analysis.supported) {
    return (
      <div className="rich-guard">
        <div>
          <h2>Use source editing for this file</h2>
          <p>Rich mode is paused because this Markdown contains: {analysis.reasons.join(", ")}.</p>
        </div>
        <button className="primary" onClick={onSourceFallback}>
          Open Source
        </button>
      </div>
    );
  }

  if (!editor) {
    return <div className="rich-loading">Loading editor...</div>;
  }

  return (
    <section className="rich-editor-shell">
      <RichToolbar editor={editor} onSourceFallback={onSourceFallback} />
      {showSlashMenu && (
        <SlashMenu
          editor={editor}
          onClose={() => {
            setShowSlashMenu(false);
          }}
        />
      )}
      <EditorContent editor={editor} className="rich-editor" />
    </section>
  );
}

function RichToolbar({ editor, onSourceFallback }: { editor: Editor; onSourceFallback: () => void }) {
  const promptForLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", previous ?? "");

    if (href === null) {
      return;
    }

    if (href.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  };

  return (
    <div className="rich-toolbar">
      <ToolButton active={editor.isActive("bold")} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolButton>
      <ToolButton active={editor.isActive("italic")} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </ToolButton>
      <ToolButton active={editor.isActive("code")} label="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={16} />
      </ToolButton>
      <ToolButton active={editor.isActive("link")} label="Link" onClick={promptForLink}>
        <Link size={16} />
      </ToolButton>
      <span className="toolbar-separator" />
      <ToolButton
        active={editor.isActive("heading", { level: 1 })}
        label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={16} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("heading", { level: 2 })}
        label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("heading", { level: 3 })}
        label="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={16} />
      </ToolButton>
      <ToolButton active={editor.isActive("blockquote")} label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={16} />
      </ToolButton>
      <ToolButton active={editor.isActive("codeBlock")} label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Rows3 size={16} />
      </ToolButton>
      <span className="toolbar-separator" />
      <ToolButton active={editor.isActive("bulletList")} label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolButton>
      <ToolButton
        active={editor.isActive("orderedList")}
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </ToolButton>
      <ToolButton active={editor.isActive("taskList")} label="Task list" onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare size={16} />
      </ToolButton>
      <span className="toolbar-separator" />
      <ToolButton label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <Table2 size={16} />
      </ToolButton>
      <ToolButton label="Add row" disabled={!editor.can().addRowAfter()} onClick={() => editor.chain().focus().addRowAfter().run()}>
        <Plus size={16} />
      </ToolButton>
      <ToolButton label="Delete row" disabled={!editor.can().deleteRow()} onClick={() => editor.chain().focus().deleteRow().run()}>
        <Trash2 size={16} />
      </ToolButton>
      <span className="toolbar-spacer" />
      <button onClick={onSourceFallback}>Source</button>
    </div>
  );
}

function SlashMenu({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const runCommand = (command: () => void) => {
    removeSlashTrigger(editor);
    command();
    onClose();
  };

  return (
    <div className="slash-menu">
      <button onClick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>Heading 1</button>
      <button onClick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>Heading 2</button>
      <button onClick={() => runCommand(() => editor.chain().focus().toggleBulletList().run())}>Bullet list</button>
      <button onClick={() => runCommand(() => editor.chain().focus().toggleTaskList().run())}>Task list</button>
      <button onClick={() => runCommand(() => editor.chain().focus().toggleCodeBlock().run())}>Code block</button>
      <button onClick={() => runCommand(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}>Table</button>
    </div>
  );
}

function removeSlashTrigger(editor: Editor) {
  const { from } = editor.state.selection;
  const before = editor.state.doc.textBetween(Math.max(0, from - 1), from);

  if (before === "/") {
    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
  }
}

function ToolButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={active ? "tool-button active" : "tool-button"}
      disabled={disabled}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
