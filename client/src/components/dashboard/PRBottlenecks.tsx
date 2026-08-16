import React from 'react';
import { GitPullRequest, Clock, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { PullRequest } from '../../types';

interface PRBottlenecksProps {
  pullRequests: PullRequest[];
  loading?: boolean;
}

export const PRBottlenecks: React.FC<PRBottlenecksProps> = ({ pullRequests, loading }) => {
  const getAgeInHours = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.max(0.1, parseFloat(hours.toFixed(1)));
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">PR Review Bottlenecks</h3>
            <p className="text-[11px] font-mono text-slate-400">Review latency & blocker radar</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
          {pullRequests.length} active PRs
        </span>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : pullRequests.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-white">All Caught Up!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Zero pending pull request review bottlenecks.
            </p>
          </div>
        ) : (
          pullRequests.map((pr) => {
            const ageHours = getAgeInHours(pr.createdAt);
            const isStale = ageHours >= 24;

            return (
              <div
                key={pr.id}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      #{pr.number}
                    </span>
                    <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                      {pr.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{pr.repository?.name || 'repo'}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className={isStale ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {ageHours}h waiting
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {isStale && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      Bottleneck
                    </span>
                  )}
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="View PR on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
