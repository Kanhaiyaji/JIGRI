import React, { useRef } from 'react';
import { FileText, Save, Play, Loader2, Upload, Download } from 'lucide-react';

interface NotebookHeaderProps {
  title: string;
  isSaving: boolean;
  isLoggedIn: boolean;
  runtimeStatus: 'disconnected' | 'starting' | 'ready' | 'running';
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onRunAll: () => void;
  onUploadIpynb?: (file: File) => void;
  onExportIpynb?: () => void;
  children?: React.ReactNode; // for RuntimeStatusBar slot
}

const NotebookHeader = ({
  title,
  isSaving,
  isLoggedIn,
  runtimeStatus,
  onTitleChange,
  onSave,
  onRunAll,
  onUploadIpynb,
  onExportIpynb,
  children,
}: NotebookHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadIpynb) {
      onUploadIpynb(file);
    }
    // reset so same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="h-14 border-b border-dark-border flex items-center justify-between px-6 shrink-0 bg-dark-card/50">
      {/* Left: title */}
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-4 h-4 text-brand-500 shrink-0" />
        <input
          id="notebook-title-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent text-white font-medium text-sm outline-none border-b border-transparent hover:border-dark-border focus:border-brand-500 transition-colors px-1 py-0.5 min-w-[150px] max-w-xs truncate"
          placeholder="Untitled Notebook"
        />
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving…
          </span>
        )}
      </div>

      {/* Right: runtime bar + actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Hidden File Input for .ipynb Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".ipynb,application/x-ipynb+json,application/json"
          onChange={handleFileChange}
          className="hidden"
          id="upload-ipynb-input"
        />

        {/* RuntimeStatusBar slot */}
        {children}

        {onUploadIpynb && (
          <button
            id="notebook-upload-ipynb-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload .ipynb notebook"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:border-brand-500/40 hover:text-white transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-brand-400" />
            Upload .ipynb
          </button>
        )}

        {onExportIpynb && (
          <button
            id="notebook-export-ipynb-btn"
            onClick={onExportIpynb}
            title="Download as .ipynb"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-dark-card border border-dark-border text-gray-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}

        <button
          id="notebook-run-all"
          onClick={onRunAll}
          disabled={runtimeStatus !== 'ready'}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-brand-500/20 font-medium"
        >
          <Play className="w-3.5 h-3.5" />
          Run All
        </button>

        {isLoggedIn && (
          <button
            id="notebook-save"
            onClick={onSave}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors shadow-sm shadow-brand-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        )}
      </div>
    </div>
  );
};

export default NotebookHeader;

