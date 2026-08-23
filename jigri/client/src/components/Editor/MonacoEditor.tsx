import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string | number;
  minHeight?: number;
  readOnly?: boolean;
  onRun?: () => void;
}

export default function MonacoEditor({
  value,
  onChange,
  language,
  height = '100%',
  minHeight = 120,
  readOnly = false,
  onRun,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback(
    (ed, monaco) => {
      editorRef.current = ed;

      // Shift+Enter or Ctrl+Enter → run
      if (onRun) {
        ed.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
          onRun();
        });
        ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onRun();
        });
      }

      // Auto-resize for 'auto' height
      if (height === 'auto') {
        const updateHeight = () => {
          const contentHeight = Math.max(minHeight, ed.getContentHeight());
          const domNode = ed.getDomNode();
          if (domNode) {
            domNode.style.height = `${contentHeight}px`;
          }
          ed.layout();
        };
        ed.onDidContentSizeChange(updateHeight);
        updateHeight();
      }
    },
    [onRun, height, minHeight]
  );

  const editorHeight = height === 'auto' ? minHeight : height;

  return (
    <Editor
      height={editorHeight}
      language={language}
      value={value}
      theme="vs-dark"
      onMount={handleMount}
      onChange={(val) => onChange(val ?? '')}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 10, bottom: 10 },
        bracketPairColorization: { enabled: true },
        wordWrap: 'on',
        renderLineHighlight: 'gutter',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        tabSize: 4,
        insertSpaces: true,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
}