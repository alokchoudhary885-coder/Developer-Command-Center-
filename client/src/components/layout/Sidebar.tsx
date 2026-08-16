import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  FolderGit2,
  GitPullRequest,
  AlertCircle,
  GitCommit,
  Rocket,
  Zap,
  Bot,
  Settings,
  Terminal,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';


interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  isAi?: boolean;
  isRealtime?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const navGroups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: 'INTELLIGENCE',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
        { to: '/deployments', label: 'Deployments', icon: Rocket },
        { to: '/dora', label: 'DORA Metrics', icon: Zap, isRealtime: true },
      ],
    },
    {
      label: 'REPOSITORY',
      items: [
        { to: '/repositories', label: 'Repositories', icon: FolderGit2 },
        { to: '/issues', label: 'Issues', icon: AlertCircle },
        { to: '/commits', label: 'Commits', icon: GitCommit },
      ],
    },
    {
      label: 'AI & PLATFORM',
      items: [
        { to: '/ai', label: 'AI Copilot', icon: Bot, isAi: true },
        { to: '/catalog', label: 'Software Catalog', icon: Box },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];


  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-[#091024]/85 backdrop-blur-2xl border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 z-50 select-none shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 text-white">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                Command Center
              </h1>
              <p className="text-[10px] font-mono text-emerald-400 font-semibold">
                Robotic Intelligence
              </p>
            </div>
          </div>

          {/* Close button for Mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onCloseMobile && onCloseMobile()}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-xs shadow-emerald-500/10'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.isAi && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          AI
                        </span>
                      )}

                      {item.isRealtime && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Live
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Operational Status & User Badge */}
        <div className="p-3 border-t border-white/10 bg-[#070d1e]/80 backdrop-blur-md space-y-2">
          {/* Real-time WebSockets Live Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="font-semibold text-slate-200">Neural Sync 60fps</span>
            </div>
            <span className="text-cyan-400 font-mono text-[9px] font-bold">LIVE</span>
          </div>

          {/* User Account Tile */}
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || user.username}
                className="w-6 h-6 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="truncate leading-tight flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || user?.username || user?.email || 'Developer'}
              </p>
              <p className="text-[10px] font-mono text-emerald-400 truncate">
                {user?.role || 'DEVELOPER'}
              </p>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
