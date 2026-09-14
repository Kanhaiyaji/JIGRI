import React, { useState } from 'react';
import { marked } from 'marked';
import type { ICell } from '../../features/notebook/notebookSlice';
import MonacoEditor from '../Editor/MonacoEditor';
import { Pencil, Check, Trash2, BookOpen } from 'lucide-react';

interface Props {
  cell: ICell;
  onUpdate: (source: string) => void;
  onRemove: () => void;
}

export default function MarkdownCell({ cell, onUpdate, onRemove }: Props) {
  const [isEditing, setIsEditing] = useState(cell.source === '');

  const rendered = marked(cell.source || '*Empty — double-click to edit*') as string;

  return (
    <div className="group border border-dark-border rounded-xl overflow-hidden bg-dark-card/40 shadow-md shadow-black/20 hover:border-purple-500/40 focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-dark-card/90 border-b border-dark-border/80 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
            <BookOpen className="w-3 h-3" />
            <span>Markdown</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Preview markdown' : 'Edit markdown'}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-purple-400/20"
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{isEditing ? 'Preview' : 'Edit'}</span>
          </button>
          <button
            onClick={onRemove}
            title="Delete cell"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-md transition-colors border border-transparent hover:border-red-400/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <MonacoEditor
          value={cell.source}
          language="markdown"
          onChange={onUpdate}
          height="auto"
          minHeight={96}
        />
      ) : (
        <div
          className="px-6 py-4 cursor-text prose prose-invert prose-sm max-w-none"
          onDoubleClick={() => setIsEditing(true)}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )}
    </div>
  );
}