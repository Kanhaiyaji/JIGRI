import React from 'react';
import { useDispatch } from 'react-redux';
import { ICell, clearCellOutput } from '../../features/notebook/notebookSlice';
import MonacoEditor from '../Editor/MonacoEditor';
import CellOutput from './CellOutput';
import { Play, Trash2, X, Loader2 } from 'lucide-react';

interface Props {
  cell: ICell;
  index: number;
  onRun: () => void;
  onUpdate: (source: string) => void;
  onRemove: () => void;
}

export default function CodeCell({ cell, index, onRun, onUpdate, onRemove }: Props) {
  const dispatch = useDispatch();

  return (
    <div className="group border border-dark-border rounded-xl overflow-hidden hover:border-brand-500/30 transition-colors">
      {/* Cell header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-card border-b border-dark-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-500 min-w-[40px]">
            [{cell.executionCount ?? ' '}]
          </span>
          <span className="text-xs text-gray-600">python</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {cell.outputs.length > 0 && (
            <button
              onClick={() => dispatch(clearCellOutput(cell.id))}
              title="Clear output"
              className="text-gray-500 hover:text-yellow-400 p-1 rounded transition-colors text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onRemove}
            title="Delete cell"
            className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <MonacoEditor
          value={cell.source}
          language="python"
          onChange={onUpdate}
          height="auto"
          minHeight={80}
          onRun={onRun}
        />
        {/* Run button overlay */}
        <button
          onClick={onRun}
          disabled={cell.isRunning}
          title="Run cell (Shift+Enter)"
          className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 hover:bg-green-500 disabled:opacity-60 text-white text-xs px-2 py-1 rounded shadow-lg transition-colors z-10"
        >
          {cell.isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Output */}
      {(cell.outputs.length > 0 || cell.isRunning) && (
        <div className="border-t border-dark-border bg-dark-bg">
          {cell.isRunning ? (
            <div className="px-4 py-3 flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running…</span>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              {cell.outputs.map((out, i) => (
                <CellOutput key={i} output={out} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}