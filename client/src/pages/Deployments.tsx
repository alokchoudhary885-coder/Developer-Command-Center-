import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Plus,
  Zap,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useSocket, ActivityEvent } from '../hooks/useSocket';

interface DeploymentItem {
  id: string;
  environment: string;
  status: 'SUCCESS' | 'IN_PROGRESS' | 'FAILURE' | 'PENDING';
  commitSha?: string;
  url?: string;
  repository?: {
    name: string;
    fullName?: string;
  };
  triggeredBy?: {
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [summary, setSummary] = useState<{ totalDeployments: number; successRate: string; activePipelines: number }>({
    totalDeployments: 0,
    successRate: '100%',
    activePipelines: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('checkout-service');
  const [selectedEnv, setSelectedEnv] = useState<'Production' | 'Staging'>('Production');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

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

  const handleRealtimeActivity = useCallback((event: ActivityEvent) => {
    if (event.type === 'DEPLOYMENT') {
      fetchDeployments();
    }
  }, [fetchDeployments]);

  useSocket(handleRealtimeActivity);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const handleTriggerDeploy = async () => {
    try {
      setIsDeploying(true);
      await api.post('/deployments/trigger', {
        environment: selectedEnv,
        status: 'SUCCESS',
        commitSha: Math.random().toString(16).substring(2, 9),
      });
      await fetchDeployments();
      setShowDeployModal(false);
    } catch (err) {
      console.error('Failed to trigger deployment:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Deployment Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Demo / Simulation Mode
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Real-time CI/CD release pipeline, environment telemetry, and rollback logs stored in PostgreSQL.
          </p>
        </div>

        <button
          onClick={() => setShowDeployModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Trigger Simulation Deploy</span>
        </button>
      </div>

      {/* Environment Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Production Card */}
        <div className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white">Production Environment</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              99.98% SLA
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Deployed</span>
              <span className="text-sm font-bold text-white">{summary.totalDeployments} Runs</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Active Pipelines</span>
              <span className="text-sm font-bold text-cyan-400">{summary.activePipelines} Live</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Pass Rate</span>
              <span className="text-sm font-bold text-emerald-400">{summary.successRate}</span>
            </div>
          </div>
        </div>

        {/* Staging Card */}
        <div className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white">Staging & Preview Builds</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Active Sync
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Simulation Status</span>
              <span className="text-sm font-bold text-white">Ready</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Branch Previews</span>
              <span className="text-sm font-bold text-cyan-400">4 Active</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Avg Latency</span>
              <span className="text-sm font-bold text-slate-200">42ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-300">Notice: Real Provider vs Simulation Mode</strong>
          <p className="text-[11px] text-amber-200/90 mt-0.5 font-sans">
            Until a cloud provider connection (AWS/GCP/Vercel) is configured in Integrations, all pipeline trigger runs execute in <strong>Demo / Simulation Mode</strong> and are recorded in the PostgreSQL database audit logs.
          </p>
        </div>
      </div>

      {/* Deployments Stream Table */}
      <div className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Database Deployment Records ({deployments.length})
          </p>
          <span className="text-[11px] font-mono text-cyan-400">PostgreSQL + Socket.IO</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400">Loading deployments...</div>
          ) : deployments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-mono">
              No deployments recorded yet. Click "Trigger Simulation Deploy" above to create one.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[11px] font-mono text-slate-400 uppercase border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Commit SHA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Triggered By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deployments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white font-mono">{dep.repository?.name || 'checkout-service'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          dep.environment === 'Production'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {dep.environment}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 border border-white/15">
                        {dep.commitSha?.substring(0, 7) || 'HEAD'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {dep.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Success
                        </span>
                      ) : dep.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold font-mono">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold font-mono">
                          <AlertTriangle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      @{dep.triggeredBy?.username || 'developer'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(dep.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Initiating rollback simulation for ${dep.repository?.name || 'service'}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
                        title="Simulate Rollback"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Trigger Deployment Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#091024]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Trigger Deployment Simulation</h3>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
              ⚡ This will create a real deployment record in PostgreSQL and emit a real-time event via Socket.IO.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Target Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="checkout-service" className="bg-[#091024] text-white">checkout-service (Payments Core)</option>
                  <option value="telemetry-engine" className="bg-[#091024] text-white">telemetry-engine (Platform Infra)</option>
                  <option value="customer-portal-web" className="bg-[#091024] text-white">customer-portal-web (Frontend)</option>
                  <option value="auth-gateway-api" className="bg-[#091024] text-white">auth-gateway-api (Security)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Target Environment</label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedEnv('Production')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedEnv === 'Production'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-xs'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    Production
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEnv('Staging')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedEnv === 'Staging'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-xs'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    Staging
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowDeployModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerDeploy}
                disabled={isDeploying}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeploying ? (
                  <span>Deploying...</span>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
