import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../store';
import {
  setNotebook,
  addCell,
  updateCell,
  removeCell,
  updateCellOutput,
  setCellRunning,
  setIsSaving,
  setLastSaved,
} from '../features/notebook/notebookSlice';
import type { ICell } from '../features/notebook/notebookSlice';
import Cell from '../components/Notebook/Cell';
import NotebookHeader from '../components/Notebook/NotebookHeader';
import RuntimeStatusBar from '../components/Notebook/RuntimeStatusBar';
import api from '../services/api';
import { Plus, Code2, Type, Upload, AlertCircle, FileCode2 } from 'lucide-react';
import { parseIpynb, exportIpynb } from '../lib/ipynb';

export default function Notebook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notebook, runtimeStatus, isSaving } = useSelector((state: RootState) => state.notebook);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomFileInputRef = useRef<HTMLInputElement>(null);

  // Create or load notebook on mount
  useEffect(() => {
    if (token) {
      if (!id) {
        // Logged-in user without notebook ID -> Create new notebook in MongoDB
        api.post('/notebooks', {
          title: 'Untitled Notebook',
          cells: [
            {
              id: uuidv4(),
              type: 'code',
              source: '# Welcome to JIGRI Python Notebook\nprint("Hello, JIGRI!")',
              outputs: [],
              executionCount: null,
            },
          ],
        }).then((res) => {
          const nb = res.data.notebook;
          dispatch(
            setNotebook({
              id: nb._id,
              title: nb.title,
              cells: nb.cells.map((c: any) => ({ ...c, isRunning: false })),
            })
          );
          navigate(`/notebook/${nb._id}`, { replace: true });
        }).catch((err) => {
          console.error('Failed to create notebook:', err);
        });
        return;
      }

      // Try to load existing notebook from API
      api.get(`/notebooks/${id}`).then((res) => {
        const nb = res.data.notebook;
        if (nb) {
          dispatch(
            setNotebook({
              id: nb._id,
              title: nb.title,
              cells: nb.cells.map((c: any) => ({ ...c, isRunning: false })),
            })
          );
        }
      }).catch(() => {
        // If not found or invalid id (e.g. guest UUID in URL), create a new notebook in MongoDB
        api.post('/notebooks', {
          title: 'Untitled Notebook',
          cells: [
            {
              id: uuidv4(),
              type: 'code',
              source: '# Welcome to JIGRI Python Notebook\nprint("Hello, JIGRI!")',
              outputs: [],
              executionCount: null,
            },
          ],
        }).then((res) => {
          const nb = res.data.notebook;
          dispatch(
            setNotebook({
              id: nb._id,
              title: nb.title,
              cells: nb.cells.map((c: any) => ({ ...c, isRunning: false })),
            })
          );
          navigate(`/notebook/${nb._id}`, { replace: true });
        }).catch((err) => {
          console.error('Failed to create fallback notebook:', err);
        });
      });
    } else {
      // Guest mode — local notebook
      if (!id) {
        const newId = uuidv4();
        dispatch(
          setNotebook({
            id: newId,
            title: 'Untitled Notebook',
            cells: [
              {
                id: uuidv4(),
                type: 'code',
                source: '# Welcome to JIGRI Python Notebook\nprint("Hello, JIGRI!")',
                outputs: [],
                executionCount: null,
                isRunning: false,
              },
            ],
          })
        );
        navigate(`/notebook/${newId}`, { replace: true });
        return;
      }

      if (!notebook || notebook.id !== id) {
        dispatch(
          setNotebook({
            id,
            title: 'Untitled Notebook',
            cells: [
              {
                id: uuidv4(),
                type: 'code',
                source: '# Welcome to JIGRI Python Notebook\nprint("Hello, JIGRI!")',
                outputs: [],
                executionCount: null,
                isRunning: false,
              },
            ],
          })
        );
      }
    }
  }, [id, token, navigate, dispatch]);

  // Auto-save (debounced) — only if logged in
  const triggerAutoSave = useCallback(() => {
    if (!token || !notebook || !id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    dispatch(setIsSaving(true));
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(`/notebooks/${id}`, {
          title: notebook.title,
          cells: notebook.cells,
        });
        dispatch(setLastSaved(new Date().toISOString()));
      } catch (_) {
        dispatch(setIsSaving(false));
      }
    }, 2000);
  }, [token, notebook, id, dispatch]);

  const handleRunCell = async (cell: ICell) => {
    if (!id) return;

    if (!token) {
      dispatch(
        updateCellOutput({
          cellId: cell.id,
          outputs: [{ type: 'error', data: 'Please sign in to run notebook cells.' }],
        })
      );
      return;
    }

    if (runtimeStatus === 'disconnected') {
      dispatch(
        updateCellOutput({
          cellId: cell.id,
          outputs: [{ type: 'error', data: 'Runtime not connected. Click "Connect" to start the Python session.' }],
        })
      );
      return;
    }

    dispatch(setCellRunning({ cellId: cell.id, isRunning: true }));
    try {
      const res = await api.post(`/notebooks/${id}/cells/${cell.id}/run`, { code: cell.source });
      const { outputs, executionCount } = res.data;
      dispatch(updateCellOutput({ cellId: cell.id, outputs, executionCount }));
    } catch (err: any) {
      dispatch(
        updateCellOutput({
          cellId: cell.id,
          outputs: [{ type: 'error', data: err.response?.data?.details || err.message || 'Execution failed' }],
        })
      );
    } finally {
      dispatch(setCellRunning({ cellId: cell.id, isRunning: false }));
    }
  };

  const handleRunAll = async () => {
    if (!notebook || !id || !token) return;
    try {
      await api.post(`/notebooks/${id}/run-all`);
      // Reload notebook to get updated outputs
      const res = await api.get(`/notebooks/${id}`);
      const nb = res.data.notebook;
      if (nb) {
        dispatch(
          setNotebook({
            id: nb._id,
            title: nb.title,
            cells: nb.cells.map((c: any) => ({ ...c, isRunning: false })),
          })
        );
      }
    } catch (err: any) {
      console.error('Run all failed:', err);
    }
  };

  const handleSave = async () => {
    if (!token || !notebook || !id) return;
    dispatch(setIsSaving(true));
    try {
      await api.put(`/notebooks/${id}`, {
        title: notebook.title,
        cells: notebook.cells,
      });
      dispatch(setLastSaved(new Date().toISOString()));
    } catch (_) {
      dispatch(setIsSaving(false));
    }
  };

  const addCodeCell = () => {
    const newCell: ICell = {
      id: uuidv4(),
      type: 'code',
      source: '',
      outputs: [],
      executionCount: null,
      isRunning: false,
    };
    dispatch(addCell({ index: notebook?.cells.length ?? 0, cell: newCell }));
    triggerAutoSave();
  };

  const addMarkdownCell = () => {
    const newCell: ICell = {
      id: uuidv4(),
      type: 'markdown',
      source: '## Section Title\n\nWrite your markdown notes and documentation here.',
      outputs: [],
      executionCount: null,
      isRunning: false,
    };
    dispatch(addCell({ index: notebook?.cells.length ?? 0, cell: newCell }));
    triggerAutoSave();
  };

  // Upload and parse .ipynb file
  const handleUploadIpynb = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.ipynb') && file.type !== 'application/json') {
      setErrorMessage('Please select a valid .ipynb Jupyter Notebook file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseIpynb(content, file.name);

        const currentId = id || notebook?.id || uuidv4();
        const updatedNotebook = {
          id: currentId,
          title: parsed.title,
          cells: parsed.cells,
        };

        dispatch(setNotebook(updatedNotebook));

        // If user is logged in, immediately persist to MongoDB
        if (token && id) {
          dispatch(setIsSaving(true));
          try {
            await api.put(`/notebooks/${id}`, {
              title: parsed.title,
              cells: parsed.cells,
            });
            dispatch(setLastSaved(new Date().toISOString()));
          } catch (saveErr) {
            console.error('Failed to auto-save imported notebook:', saveErr);
            dispatch(setIsSaving(false));
          }
        }
      } catch (err: any) {
        console.error('Failed to parse notebook:', err);
        setErrorMessage(err.message || 'Failed to read .ipynb file. Please check file format.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleExportIpynb = () => {
    if (!notebook) return;
    exportIpynb(notebook.title, notebook.cells);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadIpynb(files[0]);
    }
  };

  if (!notebook) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading notebook…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full flex flex-col bg-dark-bg overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-brand-950/80 backdrop-blur-sm border-2 border-dashed border-brand-500 flex flex-col items-center justify-center pointer-events-none transition-all animate-fadeIn">
          <div className="p-4 bg-brand-500/20 rounded-2xl border border-brand-500/40 mb-3 shadow-lg shadow-brand-500/20">
            <FileCode2 className="w-12 h-12 text-brand-400 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Drop your .ipynb file here</h3>
          <p className="text-sm text-brand-300">It will instantly import all code and markdown cells</p>
        </div>
      )}

      {/* Header */}
      <NotebookHeader
        title={notebook.title}
        isSaving={isSaving}
        isLoggedIn={Boolean(token)}
        runtimeStatus={runtimeStatus}
        onTitleChange={(title) => {
          dispatch(setNotebook({ ...notebook, title }));
          triggerAutoSave();
        }}
        onSave={handleSave}
        onRunAll={handleRunAll}
        onUploadIpynb={handleUploadIpynb}
        onExportIpynb={handleExportIpynb}
      >
        <RuntimeStatusBar notebookId={id!} />
      </NotebookHeader>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="px-6 py-2.5 bg-red-950/60 border-b border-red-800/50 flex items-center justify-between text-red-300 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-gray-400 hover:text-white ml-4 font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cells List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4 pb-32">
          {notebook.cells.map((cell, index) => (
            <Cell
              key={cell.id}
              cell={cell}
              index={index}
              onRun={() => handleRunCell(cell)}
              onUpdate={(source) => {
                dispatch(updateCell({ id: cell.id, source }));
                triggerAutoSave();
              }}
              onRemove={() => {
                dispatch(removeCell(cell.id));
                triggerAutoSave();
              }}
            />
          ))}

          {/* Add cell & Upload buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-dark-border/40 flex-wrap">
            <button
              id="add-code-cell-btn"
              onClick={addCodeCell}
              className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border hover:border-brand-500/50 hover:bg-dark-hover rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5 text-brand-400" />
              Add Code Cell
            </button>
            <button
              id="add-markdown-cell-btn"
              onClick={addMarkdownCell}
              className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border hover:border-purple-500/50 hover:bg-dark-hover rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
            >
              <Type className="w-3.5 h-3.5 text-purple-400" />
              Add Text Cell
            </button>

            <input
              ref={bottomFileInputRef}
              type="file"
              accept=".ipynb,application/x-ipynb+json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadIpynb(file);
                e.target.value = '';
              }}
              className="hidden"
            />

            <button
              id="bottom-upload-ipynb-btn"
              onClick={() => bottomFileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border hover:border-cyan-500/50 hover:bg-dark-hover rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Upload .ipynb
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}