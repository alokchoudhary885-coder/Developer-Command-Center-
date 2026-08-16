import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { api } from '../services/api';
import { Issue, IssueState } from '../types';

export const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeFilter, setActiveFilter] = useState<IssueState | 'ALL'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeFilter === 'ALL' ? '/github/issues' : `/github/issues?state=${activeFilter}`;
      const res = await api.get(endpoint);
      if (res.data.success) {
        const list = res.data.data?.issues || res.data.data || [];
        setIssues(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchIssues();

    const handleSynced = () => fetchIssues();
    window.addEventListener('telemetry-synced', handleSynced);
    return () => window.removeEventListener('telemetry-synced', handleSynced);
  }, [fetchIssues]);

  return (
    <PageContainer
      title="Issue Resolution Tracker"
      description="Monitor issue resolution velocity, SLAs, and backlog health."
      action={
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shadow-xs text-xs font-mono">
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeFilter === filter
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      }
    >
      <div className="rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Issues Found</h3>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Zero issues match filter ({activeFilter}).
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 hover:bg-white/5 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-1">
                    {issue.state === 'OPEN' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Open
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        #{issue.number}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-xl group-hover:text-cyan-400 transition-colors">
                        {issue.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                      <span>{issue.repository?.name || 'repo'}</span>
                      <span>•</span>
                      <span>assigned to @{issue.assignee?.username || 'team'}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                    title="View on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
