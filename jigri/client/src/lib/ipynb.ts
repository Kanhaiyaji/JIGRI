import { v4 as uuidv4 } from 'uuid';
import type { ICell, CellOutput } from '../features/notebook/notebookSlice';

// Strip ANSI escape codes from error traceback
function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
}

export interface ParsedNotebook {
  title: string;
  cells: ICell[];
}

export function parseIpynb(content: string, fileName?: string): ParsedNotebook {
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error('Invalid JSON format in .ipynb file');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid .ipynb structure');
  }

  const rawCells = Array.isArray(parsed.cells)
    ? parsed.cells
    : Array.isArray(parsed.worksheets?.[0]?.cells) // Notebook v3 format support
    ? parsed.worksheets[0].cells
    : [];

  const defaultTitle = fileName
    ? fileName.replace(/\.ipynb$/i, '')
    : parsed.metadata?.title || 'Imported Notebook';

  const cells: ICell[] = rawCells.map((rawCell: any): ICell => {
    const type: 'code' | 'markdown' = rawCell.cell_type === 'markdown' ? 'markdown' : 'code';

    // Source can be string or array of strings
    let source = '';
    if (Array.isArray(rawCell.source)) {
      source = rawCell.source.join('');
    } else if (typeof rawCell.source === 'string') {
      source = rawCell.source;
    } else if (Array.isArray(rawCell.input)) {
      source = rawCell.input.join('');
    } else if (typeof rawCell.input === 'string') {
      source = rawCell.input;
    }

    const outputs: CellOutput[] = [];

    if (type === 'code' && Array.isArray(rawCell.outputs)) {
      for (const out of rawCell.outputs) {
        if (!out) continue;

        if (out.output_type === 'stream') {
          const text = Array.isArray(out.text) ? out.text.join('') : (out.text || '');
          if (text) {
            outputs.push({
              type: out.name === 'stderr' ? 'error' : 'text',
              data: stripAnsi(text),
            });
          }
        } else if (out.output_type === 'execute_result' || out.output_type === 'display_data') {
          const data = out.data || {};
          if (data['image/png']) {
            outputs.push({
              type: 'image',
              data: typeof data['image/png'] === 'string' ? data['image/png'].trim() : '',
            });
          } else if (data['image/jpeg']) {
            outputs.push({
              type: 'image',
              data: typeof data['image/jpeg'] === 'string' ? data['image/jpeg'].trim() : '',
            });
          } else if (data['text/html']) {
            const htmlStr = Array.isArray(data['text/html']) ? data['text/html'].join('') : data['text/html'];
            outputs.push({
              type: 'html',
              data: htmlStr,
            });
          } else if (data['text/plain']) {
            const plainStr = Array.isArray(data['text/plain']) ? data['text/plain'].join('') : data['text/plain'];
            outputs.push({
              type: 'text',
              data: stripAnsi(plainStr),
            });
          }
        } else if (out.output_type === 'error') {
          let errorMsg = '';
          if (Array.isArray(out.traceback) && out.traceback.length > 0) {
            errorMsg = out.traceback.map((tb: string) => stripAnsi(tb)).join('\n');
          } else {
            errorMsg = `${out.ename || 'Error'}: ${out.evalue || ''}`;
          }
          outputs.push({
            type: 'error',
            data: errorMsg,
          });
        }
      }
    }

    return {
      id: rawCell.id || uuidv4(),
      type,
      source,
      outputs,
      executionCount: typeof rawCell.execution_count === 'number' ? rawCell.execution_count : null,
      isRunning: false,
    };
  });

  // If notebook had no cells, add at least one default code cell
  if (cells.length === 0) {
    cells.push({
      id: uuidv4(),
      type: 'code',
      source: '',
      outputs: [],
      executionCount: null,
      isRunning: false,
    });
  }

  return {
    title: defaultTitle,
    cells,
  };
}

export function exportIpynb(title: string, cells: ICell[]): void {
  const notebookData = {
    cells: cells.map((cell) => {
      const sourceLines = cell.source.split('\n').map((line, idx, arr) => (idx < arr.length - 1 ? line + '\n' : line));

      if (cell.type === 'markdown') {
        return {
          cell_type: 'markdown',
          metadata: {},
          source: sourceLines,
        };
      }

      // Code cell
      const outputs = cell.outputs.map((out) => {
        if (out.type === 'image') {
          return {
            output_type: 'display_data',
            data: {
              'image/png': out.data,
            },
            metadata: {},
          };
        }
        if (out.type === 'html') {
          return {
            output_type: 'display_data',
            data: {
              'text/html': out.data.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l)),
            },
            metadata: {},
          };
        }
        if (out.type === 'error') {
          return {
            output_type: 'error',
            ename: 'Error',
            evalue: out.data,
            traceback: out.data.split('\n'),
          };
        }
        // Text stream
        return {
          output_type: 'stream',
          name: 'stdout',
          text: out.data.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l)),
        };
      });

      return {
        cell_type: 'code',
        execution_count: cell.executionCount,
        metadata: {},
        outputs,
        source: sourceLines,
      };
    }),
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        name: 'python',
        version: '3.10.0',
      },
    },
    nbformat: 4,
    nbformat_minor: 4,
  };

  const jsonString = JSON.stringify(notebookData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/x-ipynb+json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeTitle = (title || 'notebook').replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.ipynb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
