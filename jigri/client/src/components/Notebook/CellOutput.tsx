import React from 'react';
import type { CellOutput } from '../../features/notebook/notebookSlice';

interface Props {
  output: CellOutput;
}

export default function CellOutput({ output }: Props) {
  if (output.type === 'image') {
    return (
      <div className="my-2">
        <img
          src={`data:image/png;base64,${output.data}`}
          alt="Cell output"
          className="max-w-full rounded border border-dark-border"
        />
      </div>
    );
  }

  if (output.type === 'html') {
    return (
      <div
        className="overflow-x-auto text-sm"
        dangerouslySetInnerHTML={{ __html: output.data }}
        style={{
          /* Basic DataFrame table styling */
        }}
      />
    );
  }

  if (output.type === 'error') {
    return (
      <pre className="text-red-400 font-mono text-xs whitespace-pre-wrap bg-red-950/20 rounded p-3 border border-red-900/30">
        {output.data}
      </pre>
    );
  }

  // text
  return (
    <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap">
      {output.data}
    </pre>
  );
}