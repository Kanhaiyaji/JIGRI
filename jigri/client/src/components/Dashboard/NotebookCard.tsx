import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Trash2, ExternalLink, Layers } from 'lucide-react';

interface Notebook {
  _id: string;
  title: string;
  cells: Array<{ type: string }>;
  createdAt: string;
  updatedAt: string;
}

interface NotebookCardProps {
  notebook: Notebook;
  onDelete: (id: string) => void;
}

const NotebookCard = ({ notebook, onDelete }: NotebookCardProps) => {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const codeCells = notebook.cells.filter((c) => c.type === 'code').length;
  const mdCells = notebook.cells.filter((c) => c.type === 'markdown').length;

  return (
    <div className="group bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/5">
      {/* Header decoration */}
      <div className="h-2 bg-gradient-to-r from-purple-500/60 to-indigo-500/60" />

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{notebook.title || 'Untitled Notebook'}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Layers className="w-3 h-3" />
                {notebook.cells.length} cells
              </span>
              <span className="text-xs text-gray-600">{codeCells} code · {mdCells} text</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {timeAgo(notebook.updatedAt)}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/notebook/${notebook._id}`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Open notebook"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              id={`delete-notebook-${notebook._id}`}
              onClick={() => onDelete(notebook._id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete notebook"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookCard;
