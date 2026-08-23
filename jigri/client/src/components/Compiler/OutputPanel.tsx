import React from 'react';
import { CheckCircle2, XCircle, Timer, Terminal } from 'lucide-react';

interface OutputPanelProps {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs?: number;
  timedOut?: boolean;
  isRunning?: boolean;
}

const OutputPanel = ({ stdout, stderr, exitCode, executionTimeMs, timedOut, isRunning }: OutputPanelProps) => {
  const hasOutput = stdout || stderr;

  if (isRunning) {
    return (
      <div className="h-full bg-dark-bg p-4 flex items-center gap-3 text-gray-400 font-mono text-sm">
        <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
        Executing…
      </div>
    );
  }

  if (!hasOutput) {
    return (
      <div className="h-full bg-dark-bg flex flex-col items-center justify-center text-gray-600">
        <Terminal className="w-8 h-8 mb-2 opacity-30" />
        <span className="text-sm">Run code to see output</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Status bar */}
      <div className={`flex items-center gap-2 px-3 py-1.5 text-xs border-b border-dark-border ${
        timedOut ? 'bg-yellow-500/5 text-yellow-400' :
        exitCode === 0 ? 'bg-green-500/5 text-green-400' :
        'bg-red-500/5 text-red-400'
      }`}>
        {timedOut ? (
          <><Timer className="w-3 h-3" /> Timed out</>
        ) : exitCode === 0 ? (
          <><CheckCircle2 className="w-3 h-3" /> Exit 0 — OK</>
        ) : (
          <><XCircle className="w-3 h-3" /> Exit {exitCode} — Error</>
        )}
        {executionTimeMs != null && (
          <span className="ml-auto opacity-60">{executionTimeMs}ms</span>
        )}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-3 font-mono text-sm space-y-1">
        {stdout && (
          <pre className="text-gray-200 whitespace-pre-wrap break-all">{stdout}</pre>
        )}
        {stderr && (
          <pre className="text-red-400 whitespace-pre-wrap break-all">{stderr}</pre>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
