import React, { useState, useEffect, useCallback } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitMerge,
  Bot,
  Search,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PRReviewModal } from '../components/pr/PRReviewModal';
import { api } from '../services/api';
import { PullRequest, PRState } from '../types';

export const PullRequests: React.FC = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<PRState | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReviewPr, setSelectedReviewPr] = useState<PullRequest | null>(null);

  const fetchPRs = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint =
        activeFilter === 'ALL'
          ? '/github/pull-requests'
          : `/github/pull-requests?state=${activeFilter}`;
      const res = await api.get(endpoint);
      if (res.data.success) {
        const list = res.data.data?.pullRequests || res.data.data || [];
        setPullRequests(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch PRs:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchPRs();

    const handleSynced = () => fetchPRs();
    window.addEventListener('telemetry-synced', handleSynced);
    return () => window.removeEventListener('telemetry-synced', handleSynced);
  }, [fetchPRs]);

  const filteredPRs = pullRequests.filter((pr) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      pr.title.toLowerCase().includes(q) ||
      String(pr.number).includes(q) ||
      (pr.author?.username || '').toLowerCase().includes(q)
    );
  });

  const getStateBadge = (state: PRState) => {
    switch (state) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <GitPullRequest className="w-3 h-3" />
            Open
          </span>
        );
      case 'MERGED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <GitMerge className="w-3 h-3" />
            Merged
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Closed
          </span>
        );
    }
  };

  return (
    <PageContainer
      title="Pull Request Intelligence"
      description="Track review velocity, stale PR bottlenecks, automated AI code reviews, and merge lifecycle telemetry."
      action={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search PRs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-40 sm:w-52"
            />
          </div>
          {/* State filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shadow-xs text-xs font-mono">
            {(['ALL', 'OPEN', 'MERGED', 'CLOSED'] as const).map((filter) => (
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
        ) : filteredPRs.length === 0 ? (
          <div className="p-12 text-center">
            <GitPullRequest className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Pull Requests Found</h3>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              {search ? `No PRs matching "${search}"` : `No pull requests matched the active filter (${activeFilter}).`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredPRs.map((pr) => (
              <div
                key={pr.id}
                className="p-4 hover:bg-white/5 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-1">{getStateBadge(pr.state)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        #{pr.number}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-xl group-hover:text-cyan-400 transition-colors">
                        {pr.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                      <span>{pr.repository?.name || 'repo'}</span>
                      <span>•</span>
                      <span>by @{pr.author?.username || 'developer'}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* AI Code Review Trigger Button (Purple AI Identity) */}
                  <button
                    onClick={() => setSelectedReviewPr(pr)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-purple-300 transition-all shadow-xs"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Review</span>
                  </button>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/10 border border-white/10 text-slate-300">
                    {pr.reviewStatus?.replace('_', ' ') || 'PENDING'}
                  </span>

                  <a
                    href={pr.url}
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

      {/* Interactive AI Code Review Drawer / Modal */}
      {selectedReviewPr && (
        <PRReviewModal
          pr={selectedReviewPr}
          onClose={() => setSelectedReviewPr(null)}
        />
      )}
    </PageContainer>
  );
};
