import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Clock, Trash2, ExternalLink } from 'lucide-react';
import { getLanguage } from '../../lib/languageRegistry';

interface Project {
  _id: string;
  name: string;
  language: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
  const lang = getLanguage(project.language);
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const preview = project.code.trim().split('\n').slice(0, 3).join('\n');

  return (
    <div className="group bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/5">
      {/* Code preview */}
      <div className="bg-dark-bg/60 p-4 border-b border-dark-border h-24 overflow-hidden relative">
        <pre className="text-xs text-gray-400 font-mono leading-relaxed">{preview}</pre>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-dark-bg/60 to-transparent" />
      </div>

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-white font-semibold text-sm truncate">{project.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base">{lang?.emoji ?? '💻'}</span>
              <span className="text-xs text-gray-400">{lang?.name ?? project.language}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {timeAgo(project.updatedAt)}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/compiler?project=${project._id}`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Open project"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              id={`delete-project-${project._id}`}
              onClick={() => onDelete(project._id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
