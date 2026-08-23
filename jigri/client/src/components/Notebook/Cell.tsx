import React from 'react';
import type { ICell } from '../../features/notebook/notebookSlice';
import CodeCell from './CodeCell';
import MarkdownCell from './MarkdownCell';

interface Props {
  cell: ICell;
  index: number;
  onRun: () => void;
  onUpdate: (source: string) => void;
  onRemove: () => void;
}

export default function Cell({ cell, index, onRun, onUpdate, onRemove }: Props) {
  if (cell.type === 'code') {
    return (
      <CodeCell
        cell={cell}
        index={index}
        onRun={onRun}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    );
  }
  return <MarkdownCell cell={cell} onUpdate={onUpdate} onRemove={onRemove} />;
}