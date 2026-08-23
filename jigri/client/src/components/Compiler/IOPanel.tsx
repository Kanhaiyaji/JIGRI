import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setStdin } from '../../features/compiler/compilerSlice';
import OutputPanel from './OutputPanel';
import { marked } from 'marked';
import { Terminal, ArrowDownCircle, Eye, Trash2 } from 'lucide-react';

const IOPanel = () => {
  const dispatch = useDispatch();
  const { stdin, output, language, code, isRunning } = useSelector((state: RootState) => state.compiler);
  const [tab, setTab] = useState<'input' | 'output'>('output');

  // Convert markdown to HTML safely with marked
  const renderedMarkdown = useMemo(() => {
    if (language !== 'markdown') return '';
    try {
      return marked.parse(code || '', { async: false }) as string;
    } catch {
      return '<p class="text-red-400">Failed to render markdown preview</p>';
    }
  }, [language, code]);

  // Live HTML Web Preview
  if (language === 'html') {
    return (
      <div className="flex flex-col h-full bg-dark-bg border-l border-dark-border">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-dark-border bg-dark-card/30 text-xs text-gray-400">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Live Web Preview</span>
        </div>
        <div className="flex-1 bg-white">
          <iframe
            title="preview"
            sandbox="allow-scripts"
            className="w-full h-full border-none"
            srcDoc={code}
          />
        </div>
      </div>
    );
  }

  // Live Markdown Preview
  if (language === 'markdown') {
    return (
      <div className="flex flex-col h-full bg-dark-bg border-l border-dark-border">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-dark-border bg-dark-card/30 text-xs text-gray-400">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span>Rendered Markdown</span>
        </div>
        <div
          className="flex-1 p-6 overflow-auto markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg border-l border-dark-border">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-dark-border bg-dark-card/20 px-2">
        <div className="flex">
          <button
            id="tab-output-btn"
            onClick={() => setTab('output')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              tab === 'output'
                ? 'text-brand-400 border-brand-500 bg-brand-500/5'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Output
          </button>
          <button
            id="tab-input-btn"
            onClick={() => setTab('input')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              tab === 'input'
                ? 'text-brand-400 border-brand-500 bg-brand-500/5'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            Input {stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
          </button>
        </div>

        {tab === 'input' && stdin && (
          <button
            onClick={() => dispatch(setStdin(''))}
            className="text-gray-500 hover:text-red-400 p-1.5 rounded text-xs flex items-center gap-1 transition-colors"
            title="Clear standard input"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden">
        {tab === 'input' ? (
          <div className="h-full p-3 flex flex-col">
            <textarea
              id="stdin-input"
              value={stdin}
              onChange={(e) => dispatch(setStdin(e.target.value))}
              className="w-full flex-1 bg-dark-card/50 border border-dark-border text-white p-3 rounded-lg outline-none font-mono text-xs resize-none focus:border-brand-500/50 transition-colors"
              placeholder="Standard input (passed to stdin during execution)..."
              spellCheck={false}
            />
            <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
              <span>Lines: {stdin ? stdin.split('\n').length : 0}</span>
              <span>Chars: {stdin.length}</span>
            </div>
          </div>
        ) : (
          <OutputPanel
            stdout={output?.stdout || ''}
            stderr={output?.stderr || ''}
            exitCode={output?.exitCode ?? null}
            executionTimeMs={output?.executionTimeMs}
            timedOut={output?.timedOut}
            isRunning={isRunning}
          />
        )}
      </div>
    </div>
  );
};

export default IOPanel;