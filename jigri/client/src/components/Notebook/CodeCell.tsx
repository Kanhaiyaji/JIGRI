import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ICell, clearCellOutput } from '../../features/notebook/notebookSlice';
import MonacoEditor from '../Editor/MonacoEditor';
import CellOutput from './CellOutput';
import { Play, Trash2, X, Loader2, Code2, Copy, Check, GripHorizontal } from 'lucide-react';

interface Props {
  cell: ICell;
  index: number;
  onRun: () => void;
  onUpdate: (source: string) => void;
  onRemove: () => void;
}

export default function CodeCell({ cell, index, onRun, onUpdate, onRemove }: Props) {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [outputHeight, setOutputHeight] = useState<number | null>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const isResizingOutput = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleCopy = () => {
    const text = cell.outputs.map((o) => o.data).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingOutput.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = outputContainerRef.current?.offsetHeight || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingOutput.current) return;
      const deltaY = moveEvent.clientY - startYRef.current;
      const newHeight = Math.max(70, startHeightRef.current + deltaY);
      setOutputHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizingOutput.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const hasError = cell.outputs.some((o) => o.type === 'error');

  return (
    <div className="group border border-dark-border rounded-xl overflow-hidden bg-dark-card/40 shadow-md shadow-black/20 hover:border-brand-500/40 focus-within:border-brand-500/60 focus-within:ring-1 focus-within:ring-brand-500/30 transition-all">
      {/* Cell header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-dark-card/90 border-b border-dark-border/80 select-none">
        {/* Left: Run button + execution count + language chip */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRun}
            disabled={cell.isRunning}
            title="Run cell (Shift+Enter)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
          >
            {cell.isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{cell.isRunning ? 'Running' : 'Run'}</span>
          </button>

          <div
            className="flex items-center font-mono text-xs px-2 py-0.5 rounded-md bg-dark-bg/80 border border-dark-border/80 text-gray-400"
            title="Execution count"
          >
            <span className="text-gray-500 text-[10px] mr-1 select-none">In</span>
            <span>[{cell.executionCount ?? ' '}]</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
            <Code2 className="w-3 h-3" />
            <span>Python</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {cell.outputs.length > 0 && (
            <button
              onClick={() => dispatch(clearCellOutput(cell.id))}
              title="Clear output"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-amber-400/20"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Clear</span>
            </button>
          )}
          <button
            onClick={onRemove}
            title="Delete cell"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-md transition-colors border border-transparent hover:border-red-400/20"
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
          minHeight={96}
          onRun={onRun}
        />
      </div>

      {/* Output Section */}
      {(cell.outputs.length > 0 || cell.isRunning) && (
        <div className="border-t border-dark-border/90 bg-[#090b11] transition-colors">
          {cell.isRunning ? (
            <div className="px-4 py-3 flex items-center gap-2.5 text-gray-400 text-xs">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
              <span>Executing cell…</span>
            </div>
          ) : (
            <div>
              {/* Output Subheader / Gutter */}
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0e111a] border-b border-dark-border/70 select-none">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center font-mono text-[11px] px-2 py-0.5 rounded bg-dark-bg/90 border border-dark-border/80 text-gray-400"
                    title="Output execution count"
                  >
                    <span className="text-gray-500 text-[10px] mr-1 select-none">Out</span>
                    <span>[{cell.executionCount ?? ' '}]</span>
                  </div>

                  {hasError ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Error
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Completed
                    </span>
                  )}
                </div>

                {/* Right: Copy output button */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    title="Copy output text"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded transition-colors hover:bg-white/[0.06]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => dispatch(clearCellOutput(cell.id))}
                    title="Clear output"
                    className="text-gray-400 hover:text-amber-400 p-1 rounded transition-colors hover:bg-white/[0.06]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Output Content container with optional resize */}
              <div
                ref={outputContainerRef}
                style={{
                  height: outputHeight ? `${outputHeight}px` : 'auto',
                  maxHeight: outputHeight ? undefined : '480px',
                }}
                className="px-4 py-3 space-y-2.5 overflow-y-auto overflow-x-hidden"
              >
                {cell.outputs.map((out, i) => (
                  <CellOutput key={i} output={out} />
                ))}
              </div>

              {/* Vertical Drag Handle */}
              <div
                onMouseDown={handleMouseDownResize}
                onDoubleClick={() => setOutputHeight(null)}
                title="Drag to resize output height (Double-click to reset)"
                className="h-2 w-full bg-[#0a0d14] hover:bg-brand-500/20 border-t border-dark-border/40 cursor-row-resize flex items-center justify-center transition-colors group/resize"
              >
                <GripHorizontal className="w-4 h-3 text-gray-600 group-hover/resize:text-brand-400 transition-colors" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}