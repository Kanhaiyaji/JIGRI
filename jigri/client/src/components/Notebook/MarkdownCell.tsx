import React, { useState } from 'react';
import { marked } from 'marked';
import type { ICell } from '../../features/notebook/notebookSlice';
import MonacoEditor from '../Editor/MonacoEditor';
import { Pencil, Check, Trash2 } from 'lucide-react';

interface Props {
  cell: ICell;
  onUpdate: (source: string) => void;
  onRemove: () => void;
}

export default function MarkdownCell({ cell, onUpdate, onRemove }: Props) {
  const [isEditing, setIsEditing] = useState(cell.source === '');

  const rendered = marked(cell.source || '*Empty — double-click to edit*') as string;

  return (
    <div className="group border border-dark-border rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-card border-b border-dark-border">
        <span className="text-xs text-gray-600">markdown</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Preview' : 'Edit'}
            className="text-gray-500 hover:text-purple-400 p-1 rounded transition-colors"
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onRemove}
            title="Delete cell"
            className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
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
          minHeight={100}
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