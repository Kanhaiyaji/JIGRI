import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setRuntimeStatus } from '../../features/notebook/notebookSlice';
import api from '../../services/api';
import { Loader2, Power, RefreshCw, PowerOff } from 'lucide-react';

interface Props {
  notebookId: string;
}

export default function RuntimeStatusBar({ notebookId }: Props) {
  const dispatch = useDispatch();
  const status = useSelector((state: RootState) => state.notebook.runtimeStatus);
  const token = useSelector((state: RootState) => state.auth.token);

  const statusConfig = {
    disconnected: { dot: 'bg-red-500', label: 'Disconnected', textColor: 'text-red-400' },
    starting: { dot: 'bg-yellow-500 animate-pulse', label: 'Starting…', textColor: 'text-yellow-400' },
    ready: { dot: 'bg-green-500', label: 'Connected', textColor: 'text-green-400' },
    running: { dot: 'bg-blue-500 animate-pulse', label: 'Running', textColor: 'text-blue-400' },
  } as const;

  const cfg = statusConfig[status];

  const handleConnect = async () => {
    if (!token) {
      alert('Please log in to use the notebook runtime.');
      return;
    }
    dispatch(setRuntimeStatus('starting'));
    try {
      await api.post(`/notebooks/${notebookId}/runtime/start`);
      dispatch(setRuntimeStatus('ready'));
    } catch (err: any) {
      dispatch(setRuntimeStatus('disconnected'));
      console.error('Failed to start runtime:', err);
    }
  };

  const handleRestart = async () => {
    if (!token) return;
    dispatch(setRuntimeStatus('starting'));
    try {
      await api.post(`/notebooks/${notebookId}/runtime/restart`);
      dispatch(setRuntimeStatus('ready'));
    } catch {
      dispatch(setRuntimeStatus('disconnected'));
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    try {
      await api.post(`/notebooks/${notebookId}/runtime/stop`);
    } finally {
      dispatch(setRuntimeStatus('disconnected'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status indicator */}
      <div className="flex items-center gap-2 bg-dark-card border border-dark-border px-3 py-1.5 rounded-full text-sm">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className={`${cfg.textColor} text-xs font-medium`}>{cfg.label}</span>
      </div>

      {/* Actions */}
      {status === 'disconnected' && (
        <button
          onClick={handleConnect}
          title="Connect runtime"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors"
        >
          <Power className="w-3.5 h-3.5" />
          Connect
        </button>
      )}

      {status === 'starting' && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Starting…
        </span>
      )}

      {status === 'ready' && (
        <>
          <button
            onClick={handleRestart}
            title="Restart runtime (clears all variables)"
            className="text-xs px-2.5 py-1.5 rounded bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDisconnect}
            title="Disconnect runtime"
            className="text-xs px-2.5 py-1.5 rounded bg-dark-card border border-dark-border text-gray-400 hover:text-red-400 hover:bg-dark-hover transition-colors"
          >
            <PowerOff className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}