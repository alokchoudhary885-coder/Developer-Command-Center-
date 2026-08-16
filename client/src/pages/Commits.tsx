import React, { useState, useEffect, useCallback } from 'react';
import { GitCommit, Clock, ExternalLink } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { api } from '../services/api';
import { Commit } from '../types';

export const Commits: React.FC = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCommits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/github/commits');
      if (res.data.success) {
        const list = res.data.data?.commits || res.data.data || [];
        setCommits(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch commits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommits();

    const handleSynced = () => fetchCommits();
    window.addEventListener('telemetry-synced', handleSynced);
    return () => window.removeEventListener('telemetry-synced', handleSynced);
  }, [fetchCommits]);

  return (
    <PageContainer
      title="Commit Telemetry"
      description="Real-time stream of codebase commits and author contributions."
    >
      <div className="rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : commits.length === 0 ? (
          <div className="p-12 text-center">
            <GitCommit className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Commits Recorded</h3>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Commits will appear as webhooks push changes to tracked repositories.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {commits.map((commit) => (
              <div
                key={commit.id}
                className="p-4 hover:bg-white/5 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-white/10 px-2 py-0.5 rounded">
                        {commit.sha?.substring(0, 7)}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-xl group-hover:text-cyan-400 transition-colors">
                        {commit.message}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                      <span>{commit.repository?.name || 'repo'}</span>
                      <span>•</span>
                      <span>by @{commit.author || 'developer'}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{commit.committedAt ? new Date(commit.committedAt).toLocaleString() : 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {commit.url && (
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
