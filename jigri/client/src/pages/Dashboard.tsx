import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import ProjectCard from '../components/Dashboard/ProjectCard';
import NotebookCard from '../components/Dashboard/NotebookCard';
import { parseIpynb } from '../lib/ipynb';
import {
  LayoutDashboard,
  Terminal,
  BookOpen,
  Plus,
  History,
  Folder,
  LogIn,
  Loader2,
  Code2,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Upload,
  AlertCircle,
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  language: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface Notebook {
  _id: string;
  title: string;
  cells: Array<{ type: string }>;
  createdAt: string;
  updatedAt: string;
}

interface Execution {
  _id: string;
  language: string;
  exitCode: number | null;
  executionTimeMs: number;
  status: string;
  createdAt: string;
}

type Tab = 'projects' | 'notebooks' | 'history';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchAll();
  }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, nbRes, execRes] = await Promise.all([
        api.get('/projects').catch(() => ({ data: { projects: [] } })),
        api.get('/notebooks').catch(() => ({ data: { notebooks: [] } })),
        api.get('/execute/history').catch(() => ({ data: { executions: [] } })),
      ]);
      setProjects(projRes.data.projects ?? []);
      setNotebooks(nbRes.data.notebooks ?? []);
      setExecutions(execRes.data.executions ?? []);
    } catch (e: any) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {}
  };

  const deleteNotebook = async (id: string) => {
    try {
      await api.delete(`/notebooks/${id}`);
      setNotebooks((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {}
  };

  const createNotebook = async () => {
    try {
      const res = await api.post('/notebooks', { title: 'Untitled Notebook', cells: [] });
      navigate(`/notebook/${res.data.notebook._id}`);
    } catch (e) {
      navigate('/notebook');
    }
  };

  const handleUploadIpynb = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.ipynb') && file.type !== 'application/json') {
      setError('Please select a valid .ipynb Jupyter Notebook file.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseIpynb(content, file.name);

        const res = await api.post('/notebooks', {
          title: parsed.title,
          cells: parsed.cells,
        });

        if (res.data?.notebook?._id) {
          navigate(`/notebook/${res.data.notebook._id}`);
        } else {
          fetchAll();
        }
      } catch (err: any) {
        console.error('Upload notebook error:', err);
        setError(err.message || 'Failed to parse .ipynb file.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file from disk.');
      setUploading(false);
    };
    reader.readAsText(file);
  };

  // Not logged in
  if (!token) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-dark-bg text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6">
          <LayoutDashboard className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Sign in to access your Dashboard</h1>
        <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
          Your projects, notebooks, and execution history are saved to your account. Sign in to access them from any device.
        </p>
        <div className="flex gap-3">
          <Link
            to="/compiler"
            className="flex items-center gap-2 px-5 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-all"
          >
            <Terminal className="w-4 h-4" />
            Try Compiler
          </Link>
          <button
            id="dashboard-login-prompt"
            onClick={() => document.getElementById('login-btn')?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm text-white font-semibold transition-all shadow-lg shadow-brand-500/20"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'projects', label: 'Projects', icon: <Folder className="w-4 h-4" />, count: projects.length },
    { id: 'notebooks', label: 'Notebooks', icon: <BookOpen className="w-4 h-4" />, count: notebooks.length },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" />, count: executions.length },
  ];

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === 'timeout') return <Timer className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg overflow-hidden">
      {/* Hidden File Input for Dashboard .ipynb Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ipynb,application/x-ipynb+json,application/json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadIpynb(file);
          e.target.value = '';
        }}
        className="hidden"
        id="dashboard-upload-ipynb-input"
      />

      {/* Header */}
      <div className="shrink-0 border-b border-dark-border bg-dark-bg/80 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-brand-400" />
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back, <span className="text-gray-300 font-medium">{user?.username}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/compiler"
                className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-all"
              >
                <Terminal className="w-3.5 h-3.5" />
                New Code
              </Link>
              <button
                id="dashboard-upload-ipynb-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3.5 py-2 bg-dark-card border border-dark-border hover:border-cyan-500/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all shadow-sm"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                )}
                Upload .ipynb
              </button>
              <button
                id="new-notebook-btn"
                onClick={createNotebook}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm text-white font-medium transition-all shadow-lg shadow-brand-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                New Notebook
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Projects', value: projects.length, icon: <Code2 className="w-4 h-4" />, color: 'text-brand-400' },
              { label: 'Notebooks', value: notebooks.length, icon: <BookOpen className="w-4 h-4" />, color: 'text-purple-400' },
              { label: 'Executions', value: executions.length, icon: <History className="w-4 h-4" />, color: 'text-green-400' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-dark-card border border-dark-border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={`${color} opacity-80`}>{icon}</div>
                <div>
                  <div className="text-lg font-bold text-white">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Tab bar */}
          <div className="flex gap-1 mb-6 border-b border-dark-border pb-0">
            {tabs.map(({ id, label, icon, count }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                  tab === id
                    ? 'border-brand-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {icon}
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-brand-500/20 text-brand-300' : 'bg-dark-card text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Projects */}
              {tab === 'projects' && (
                <div>
                  {projects.length === 0 ? (
                    <EmptyState
                      icon={<Folder className="w-8 h-8" />}
                      title="No projects yet"
                      desc="Save code from the compiler to see your projects here."
                      action={<Link to="/compiler" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm text-white font-medium transition-all">
                        <Terminal className="w-4 h-4" /> Open Compiler
                      </Link>}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project) => (
                        <ProjectCard key={project._id} project={project} onDelete={deleteProject} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notebooks */}
              {tab === 'notebooks' && (
                <div>
                  {notebooks.length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="w-8 h-8" />}
                      title="No notebooks yet"
                      desc="Create a Python notebook or upload an existing .ipynb file."
                      action={
                        <div className="flex items-center gap-3">
                          <button
                            id="empty-upload-notebook"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border hover:border-cyan-500/50 rounded-lg text-sm text-gray-200 font-medium transition-all"
                          >
                            <Upload className="w-4 h-4 text-cyan-400" /> Upload .ipynb
                          </button>
                          <button
                            id="empty-new-notebook"
                            onClick={createNotebook}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm text-white font-medium transition-all"
                          >
                            <Plus className="w-4 h-4" /> New Notebook
                          </button>
                        </div>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notebooks.map((nb) => (
                        <NotebookCard key={nb._id} notebook={nb} onDelete={deleteNotebook} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Execution History */}
              {tab === 'history' && (
                <div>
                  {executions.length === 0 ? (
                    <EmptyState
                      icon={<History className="w-8 h-8" />}
                      title="No execution history"
                      desc="Run code in the compiler to see your execution history here."
                      action={<Link to="/compiler" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm text-white font-medium transition-all">
                        <Terminal className="w-4 h-4" /> Open Compiler
                      </Link>}
                    />
                  ) : (
                    <div className="space-y-2">
                      {executions.map((exec) => (
                        <div key={exec._id} className="flex items-center justify-between bg-dark-card border border-dark-border rounded-xl px-4 py-3 hover:border-dark-hover transition-colors">
                          <div className="flex items-center gap-3">
                            {statusIcon(exec.status)}
                            <div>
                              <span className="text-sm text-white font-medium capitalize">{exec.language}</span>
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                exec.status === 'success' ? 'bg-green-500/10 text-green-400' :
                                exec.status === 'timeout' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>{exec.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {exec.executionTimeMs && <span>{exec.executionTimeMs}ms</span>}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(exec.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-gray-500 mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-sm mb-6">{desc}</p>
      {action}
    </div>
  );
}