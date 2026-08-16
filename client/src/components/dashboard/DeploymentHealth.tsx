import React, { useState, useEffect, useCallback } from 'react';
import { Rocket, CheckCircle2, XCircle, Clock, ExternalLink, Play } from 'lucide-react';
import { Deployment } from '../../types';
import { api } from '../../services/api';

export const DeploymentHealth: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [summary, setSummary] = useState<{
    totalDeployments: number;
    successRate: string;
    activePipelines: number;
  }>({
    totalDeployments: 0,
    successRate: '100%',
    activePipelines: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/deployments');
      if (res.data.success) {
        setDeployments(res.data.data?.deployments || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeployments();

    const handleSynced = () => fetchDeployments();
    window.addEventListener('telemetry-synced', handleSynced);
    return () => window.removeEventListener('telemetry-synced', handleSynced);
  }, [fetchDeployments]);

  const handleSimulateDeploy = async () => {
    try {
      setTriggering(true);
      await api.post('/deployments/trigger', {
        environment: 'Production',
        status: 'SUCCESS',
        commitSha: '7f9c2d1',
      });
      await fetchDeployments();
    } catch (err) {
      console.error('Failed to trigger deploy:', err);
    } finally {
      setTriggering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Passed
          </span>
        );
      case 'FAILURE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-400" />
            Failed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin text-amber-400" />
            Deploying
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300 border border-white/15">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col justify-between h-full space-y-4">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">CI/CD Pipeline Telemetry</h3>
              <p className="text-[11px] font-mono text-slate-400">Automated builds & release health</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-emerald-400">
                {summary.successRate}
              </span>
              <span className="text-[10px] text-slate-400 block">Pass Rate</span>
            </div>

            <button
              onClick={handleSimulateDeploy}
              disabled={triggering}
              title="Simulate Deployment Run"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${triggering ? 'animate-spin' : ''}`} />
              <span>Deploy</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : deployments.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
            <Rocket className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-300">No recent deployments recorded.</p>
            <button
              onClick={handleSimulateDeploy}
              className="mt-2 text-xs font-mono text-emerald-400 hover:underline"
            >
              Trigger instant test deployment
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {deployments.slice(0, 4).map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getStatusBadge(d.status)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {d.repository?.name || 'repo'}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {d.environment}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Commit {d.commitSha?.substring(0, 7) || 'HEAD'} • {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
