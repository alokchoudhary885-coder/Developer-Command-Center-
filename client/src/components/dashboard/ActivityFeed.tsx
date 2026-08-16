import React from 'react';
import {
  Activity,
  GitPullRequest,
  AlertCircle,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';
import { ActivityLog } from '../../types';

interface ActivityFeedProps {
  activities: ActivityLog[];
  loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PR_OPENED':
      case 'PR_UPDATED':
        return <GitPullRequest className="w-3.5 h-3.5 text-cyan-400" />;
      case 'PR_MERGED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PR_CLOSED':
        return <GitPullRequest className="w-3.5 h-3.5 text-rose-400" />;
      case 'ISSUE_OPENED':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'ISSUE_CLOSED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'COMMITS_PUSHED':
        return <GitCommit className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const minutes = Math.max(
      1,
      Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60))
    );
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live Activity Feed</h3>
            <p className="text-[11px] font-mono text-slate-400">Socket.IO real-time telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Real-time</span>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-mono">
            No recent activity recorded.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-white/10 border border-white/15">
                  {getActionIcon(act.action)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    <span className="text-cyan-400 font-bold">
                      @{act.user?.username || act.metadata?.author || 'developer'}
                    </span>{' '}
                    {act.action.replace('_', ' ').toLowerCase()}{' '}
                    {act.metadata?.number ? `#${act.metadata.number}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {act.metadata?.title || act.metadata?.headCommit || act.repository?.name || 'Code updates'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {formatTimeAgo(act.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
