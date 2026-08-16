import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  GitPullRequest,
  GitCommit,
  AlertCircle,
  Rocket,
  Clock,
} from 'lucide-react';
import { useSocket, ActivityEvent } from '../hooks/useSocket';
import { api } from '../services/api';

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
  user?: {
    username: string;
    avatarUrl?: string;
  };
  repository?: {
    name: string;
  };
}

export const LiveActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchActivities = async () => {
    try {
      const res = await api.get('/github/activity');
      if (res.data?.success && res.data?.data?.activities) {
        setActivities(res.data.data.activities);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const handleSocketActivity = useCallback((event: ActivityEvent) => {
    const newAct: ActivityItem = {
      id: `live_${Date.now()}`,
      action: event.action,
      entityType: event.type,
      metadata: event.metadata,
      createdAt: event.timestamp || new Date().toISOString(),
      user: { username: event.actor, avatarUrl: event.actorAvatar },
      repository: { name: event.repositoryName || 'repo' },
    };
    setActivities((prev) => [newAct, ...prev]);
  }, []);

  const { isConnected } = useSocket(handleSocketActivity);

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = activities.filter((act) => {
    if (filter === 'ALL') return true;
    if (filter === 'PR') return act.entityType === 'PULL_REQUEST' || act.action.includes('PR');
    if (filter === 'COMMIT') return act.entityType === 'COMMIT' || act.action.includes('COMMIT');
    if (filter === 'ISSUE') return act.entityType === 'ISSUE' || act.action.includes('ISSUE');
    if (filter === 'DEPLOY') return act.entityType === 'DEPLOYMENT' || act.action.includes('DEPLOY');
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Radio className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Live Activity Stream</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Real-time event stream powered by Socket.IO broadcasting commits, PR reviews, issues, and deployments.
          </p>
        </div>

        {/* Live Status Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border self-start sm:self-auto ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{isConnected ? 'LIVE WEBSOCKET 60FPS' : 'RECONNECTING'}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 shadow-xs w-fit text-xs font-mono">
        {['ALL', 'PR', 'COMMIT', 'ISSUE', 'DEPLOY'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === f
                ? 'bg-cyan-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f === 'ALL' ? 'All Events' : f}
          </button>
        ))}
      </div>

      {/* Activities Timeline */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center text-slate-400 text-xs font-mono shadow-xl">
            No activity events recorded yet. Click "Sync GitHub" to populate.
          </div>
        ) : (
          filtered.map((act) => {
            const isPR = act.entityType === 'PULL_REQUEST' || act.action.includes('PR');
            const isCommit = act.entityType === 'COMMIT' || act.action.includes('COMMIT');
            const isDeploy = act.entityType === 'DEPLOYMENT' || act.action.includes('DEPLOY');

            return (
              <div
                key={act.id}
                className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      isPR
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        : isCommit
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : isDeploy
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {isPR ? (
                      <GitPullRequest className="w-4 h-4" />
                    ) : isCommit ? (
                      <GitCommit className="w-4 h-4" />
                    ) : isDeploy ? (
                      <Rocket className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{act.action}</span>
                      {act.repository?.name && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/10 text-cyan-300 border border-white/15">
                          {act.repository.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-mono">
                      by <strong className="text-emerald-400">@{act.user?.username || 'developer'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
