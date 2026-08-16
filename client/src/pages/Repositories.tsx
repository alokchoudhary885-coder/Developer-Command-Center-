import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  Star,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Lock,
  Globe,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { api } from '../services/api';
import { Repository } from '../types';

export const Repositories: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/github/repositories');
      if (res.data.success) {
        const list = res.data.data?.repositories || res.data.data || [];
        setRepositories(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch repos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();

    const handleSynced = () => fetchRepositories();
    window.addEventListener('telemetry-synced', handleSynced);
    return () => window.removeEventListener('telemetry-synced', handleSynced);
  }, [fetchRepositories]);

  const handleSyncRepo = async (repo: Repository) => {
    try {
      setSyncingId(repo.id);
      await api.post(`/github/sync/repositories/${repo.id}/pulls`);
      await fetchRepositories();
    } catch (err) {
      console.error('Sync failed for repo:', err);
    } finally {
      setSyncingId(null);
    }
  };

  const filteredRepos = repositories.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.language && r.language.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageContainer
      title="Tracked Repositories"
      description="GitHub repositories integrated with continuous telemetry and real-time webhook sync."
      action={
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-xs"
          />
        </div>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 text-center shadow-xl">
          <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Repositories Found</h3>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Click "Sync GitHub" in the top bar to import your repositories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="p-5 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 shadow-xl transition-all flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors font-mono">
                        {repo.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {repo.owner}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Sync freshness indicator */}
                    {(() => {
                      const updatedAt = repo.updatedAt ? new Date(repo.updatedAt) : null;
                      const ageHours = updatedAt ? (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60) : Infinity;
                      if (ageHours < 1) return (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Synced</span>
                      );
                      if (ageHours < 24) return (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">{Math.round(ageHours)}h ago</span>
                      );
                      return (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Stale</span>
                      );
                    })()}
                    <span className="p-1 text-slate-400" title={repo.isPrivate ? 'Private' : 'Public'}>
                      {repo.isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  </div>
                </div>

                {repo.description && (
                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {repo.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  {repo.language && (
                    <span className="flex items-center gap-1 text-slate-200 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    {repo.starsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    {repo.openIssuesCount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSyncRepo(repo)}
                    disabled={syncingId === repo.id}
                    title="Sync Telemetry"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-cyan-400 transition-all"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${syncingId === repo.id ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
