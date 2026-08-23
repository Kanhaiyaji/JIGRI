import React from 'react';
import { Copy, Download, RotateCcw, Maximize2, Minimize2, Settings } from 'lucide-react';

interface EditorToolbarProps {
  language: string;
  filename?: string;
  isFullscreen?: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  onToggleFullscreen?: () => void;
}

const EditorToolbar = ({
  language,
  filename,
  isFullscreen = false,
  onCopy,
  onDownload,
  onReset,
  onToggleFullscreen,
}: EditorToolbarProps) => {
  const iconBtn = (id: string, icon: React.ReactNode, title: string, onClick?: () => void) => (
    <button
      id={id}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all"
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-dark-card/40 border-b border-dark-border">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        {filename && <span className="font-mono">{filename}</span>}
      </div>
      <div className="flex items-center gap-0.5">
        {iconBtn('toolbar-copy', <Copy className="w-3.5 h-3.5" />, 'Copy code', onCopy)}
        {iconBtn('toolbar-download', <Download className="w-3.5 h-3.5" />, 'Download file', onDownload)}
        {iconBtn('toolbar-reset', <RotateCcw className="w-3.5 h-3.5" />, 'Reset to default', onReset)}
        {onToggleFullscreen && iconBtn(
          'toolbar-fullscreen',
          isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />,
          isFullscreen ? 'Exit fullscreen' : 'Fullscreen',
          onToggleFullscreen
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
