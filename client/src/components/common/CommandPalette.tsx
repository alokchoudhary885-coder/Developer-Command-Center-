import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Box,
  GitPullRequest,
  AlertCircle,
  GitCommit,
  FolderGit2,
  Rocket,
  Zap,
  Bot,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'dash',    title: 'Dashboard — Engineering Command Center', category: 'INTELLIGENCE', icon: LayoutDashboard, path: '/dashboard', shortcut: 'G D' },
  { id: 'prs',     title: 'Pull Requests — AI Review & Bottlenecks', category: 'INTELLIGENCE', icon: GitPullRequest,  path: '/pull-requests' },
  { id: 'deploy',  title: 'Deployments — CI/CD Pipeline Health',     category: 'INTELLIGENCE', icon: Rocket,          path: '/deployments' },
  { id: 'dora',    title: 'DORA Metrics — Speed & Stability Benchmarks', category: 'INTELLIGENCE', icon: Zap, path: '/dora', badge: 'LIVE' },
  { id: 'repo',    title: 'Repositories — GitHub Sync Status',       category: 'REPOSITORY',    icon: FolderGit2,     path: '/repositories' },
  { id: 'issues',  title: 'Issues — Incident & Bug Tracking',        category: 'REPOSITORY',    icon: AlertCircle,    path: '/issues' },
  { id: 'commits', title: 'Commits — Velocity & History',            category: 'REPOSITORY',    icon: GitCommit,      path: '/commits' },
  { id: 'ai',      title: 'AI Copilot — Gemini Engineering Assistant', category: 'AI & PLATFORM', icon: Bot,          path: '/ai', badge: 'AI' },
  { id: 'cat',     title: 'Software Catalog — Service Registry',     category: 'AI & PLATFORM', icon: Box,            path: '/catalog' },
  { id: 'settings',title: 'Settings — GitHub Sync & Webhooks',       category: 'AI & PLATFORM', icon: Settings,       path: '/settings' },
];


interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          navigate(filteredCommands[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#091024]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/5">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, services, metrics, or actions... (Esc to close)"
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white/10 border border-white/15 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/5">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              No matching pages or actions found for "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected ? 'bg-emerald-500/20 text-white border border-emerald-500/30' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white">{cmd.title}</p>
                        {cmd.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                            cmd.badge === 'AI'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}>{cmd.badge}</span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">{cmd.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cmd.shortcut && (
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        {cmd.shortcut}
                      </span>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-t border-white/10 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded">↓</kbd></span>
            <span>Select: <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded">↵</kbd></span>
          </div>
          <span>Developer Command Center</span>
        </div>
      </div>
    </div>
  );
};
