import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCode, setLanguage, executeCode } from '../features/compiler/compilerSlice';
import { getLanguage } from '../lib/languageRegistry';
import MonacoEditor from '../components/Editor/MonacoEditor';
import LanguageSelector from '../components/Compiler/LanguageSelector';
import EditorToolbar from '../components/Editor/EditorToolbar';
import IOPanel from '../components/Compiler/IOPanel';
import api from '../services/api';
import { Play, Loader2, Save, Check } from 'lucide-react';

export default function Compiler() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, code, isRunning, output } = useSelector((state: RootState) => state.compiler);
  const token = useSelector((state: RootState) => state.auth.token);
  const hasInit = useRef(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentLang = getLanguage(language);
  const isWeb = language === 'html' || language === 'markdown';

  // Support ?lang=python and ?project=123 query params
  useEffect(() => {
    if (!hasInit.current) {
      hasInit.current = true;
      const langParam = searchParams.get('lang');
      if (langParam) {
        dispatch(setLanguage(langParam));
      }

      const projectId = searchParams.get('project');
      if (projectId && token) {
        api.get(`/projects/${projectId}`).then((res) => {
          const p = res.data.project;
          if (p) {
            setProjectName(p.name);
            dispatch(setLanguage(p.language));
            dispatch(setCode(p.code));
          }
        }).catch(() => {});
      }
    }
  }, [searchParams, token, dispatch]);

  const handleRun = () => {
    if (!isWeb) {
      dispatch(executeCode() as any);
    }
  };

  const handleSaveProject = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const projectId = searchParams.get('project');
      if (projectId) {
        await api.put(`/projects/${projectId}`, {
          name: projectName,
          language,
          code,
        });
      } else {
        const res = await api.post('/projects', {
          name: projectName,
          language,
          code,
        });
        if (res.data.project?._id) {
          setSearchParams({ project: res.data.project._id });
        }
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleDownload = () => {
    const ext = currentLang?.extension || 'txt';
    const filename = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'code'}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (currentLang?.defaultCode) {
      dispatch(setCode(currentLang.defaultCode));
    }
  };

  return (
    <div className={`flex flex-col h-full bg-dark-bg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Header / Action Bar */}
      <div className="h-13 border-b border-dark-border flex items-center justify-between px-4 shrink-0 bg-dark-card/60 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          <input
            id="compiler-project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="bg-transparent text-gray-300 hover:text-white focus:text-white text-xs font-mono px-2 py-1 rounded border border-transparent hover:border-dark-border focus:border-brand-500/50 outline-none transition-all w-36 sm:w-48"
          />
        </div>

        <div className="flex items-center gap-3">
          {output && !isRunning && (
            <span className={`text-xs font-mono hidden sm:inline ${output.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {output.timedOut ? '⏱ Timed out' : output.exitCode === 0 ? '✓ Exited 0' : `✗ Exited ${output.exitCode}`}
              {output.executionTimeMs ? ` · ${output.executionTimeMs}ms` : ''}
            </span>
          )}

          {token && (
            <button
              id="save-project-btn"
              onClick={handleSaveProject}
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-dark-card border border-dark-border hover:bg-dark-hover text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSaved ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}

          <button
            id="run-code-btn"
            onClick={handleRun}
            disabled={isRunning || isWeb}
            title={isWeb ? 'Web languages render live — no execution needed' : 'Run code (Ctrl+Enter)'}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-500/20"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Column */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-dark-border">
          <EditorToolbar
            language={language}
            filename={`main.${currentLang?.extension || language}`}
            isFullscreen={isFullscreen}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onReset={handleReset}
            onToggleFullscreen={() => setIsFullscreen((v) => !v)}
          />
          <div className="flex-1 min-h-0">
            <MonacoEditor
              value={code}
              language={language}
              onChange={(val) => dispatch(setCode(val))}
              onRun={handleRun}
            />
          </div>
        </div>

        {/* IO / Preview Panel Column */}
        <div className="w-96 shrink-0 flex flex-col">
          <IOPanel />
        </div>
      </div>
    </div>
  );
}