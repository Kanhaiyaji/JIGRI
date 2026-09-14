import React from 'react';
import type { CellOutput } from '../../features/notebook/notebookSlice';
import { AlertTriangle, ImageIcon } from 'lucide-react';

interface Props {
  output: CellOutput;
}

export default function CellOutput({ output }: Props) {
  if (output.type === 'image') {
    return (
      <div className="my-2 p-2 bg-dark-bg/60 rounded-xl border border-dark-border inline-block max-w-full shadow-md">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2 px-1">
          <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
          <span>Rendered Plot</span>
        </div>
        <img
          src={`data:image/png;base64,${output.data}`}
          alt="Cell output plot"
          className="max-w-full rounded-lg border border-dark-border/40"
        />
      </div>
    );
  }

  if (output.type === 'html') {
    return (
      <div
        className="dataframe-table-container"
        dangerouslySetInnerHTML={{ __html: output.data }}
      />
    );
  }

  if (output.type === 'error') {
    return (
      <div className="my-1 rounded-lg bg-red-950/25 border border-red-500/30 border-l-4 border-l-red-500 overflow-hidden text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-red-950/40 border-b border-red-900/30 text-red-400 font-semibold text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Execution Error</span>
        </div>
        <pre className="p-3.5 text-red-300 font-mono text-xs whitespace-pre-wrap overflow-x-auto leading-relaxed select-text">
          {output.data}
        </pre>
      </div>
    );
  }

  // text output (stdout / print statements)
  return (
    <pre className="text-gray-200 font-mono text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap select-text p-3 bg-[#0d1017] rounded-lg border border-dark-border/60 overflow-x-auto shadow-inner">
      {output.data}
    </pre>
  );
}