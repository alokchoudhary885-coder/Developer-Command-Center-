import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCw,
  Bell,
  ChevronDown,
  LogOut,
  Shield,
  CheckCircle2,
  Lock,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CommandPalette } from '../common/CommandPalette';

interface TopbarProps {
  onOpenMobile?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobile }) => {
  const { user, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const handleSyncGitHub = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Syncing...');
      const res = await api.post('/github/sync/all');
      if (res.data?.success) {
        setSyncStatus('Synced');
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncStatus('Sync Error');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="h-16 bg-[#091024]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between fixed top-0 right-0 left-0 lg:left-64 z-30 select-none shadow-lg">
        {/* Left Side: Mobile Menu Button & Search */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          {onOpenMobile && (
            <button
              onClick={onOpenMobile}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Command Palette Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono transition-all group w-48 sm:w-64 justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
              <span className="truncate">Search command...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-semibold text-slate-300">
              {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sync GitHub Button */}
          <button
            onClick={handleSyncGitHub}
            disabled={isSyncing}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncStatus || 'Sync GitHub'}</span>
            <span className="sm:hidden">{isSyncing ? '...' : 'Sync'}</span>
          </button>

          {/* Notifications Bell */}
          <button className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#091024]" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || user.username}
                  className="w-7 h-7 rounded-lg object-cover border border-white/20"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden sm:block leading-tight text-left">
                <span className="text-xs font-semibold text-white block truncate max-w-[120px]">
                  {user?.name || user?.username || user?.email || 'Developer'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                  {user?.role || 'DEVELOPER'}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0b142d]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header Info */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 mb-1.5">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.name || user?.username || user?.email || 'Developer'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {user?.email || `${user?.username}@commandcenter.dev`}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified ({user?.authProvider || 'LOCAL'})</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Role: {user?.role || 'DEVELOPER'}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Session: HttpOnly JWT</span>
                  </div>
                </div>

                <div className="border-t border-white/10 my-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out & Terminate Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
