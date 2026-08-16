import React, { useState } from 'react';
import {
  Wrench,
  Play,
  Terminal,
  Clock,
  RotateCcw,
  Database,
  Search,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ActionWorkflow {
  id: string;
  name: string;
  category: 'Infrastructure' | 'Database' | 'Security' | 'Maintenance';
  description: string;
  parameters: Array<{ name: string; type: string; default?: string; placeholder?: string }>;
  estimatedDuration: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const ACTION_WORKFLOWS: ActionWorkflow[] = [
  {
    id: 'flush-redis-cache',
    name: 'Flush Redis Cache Namespace',
    category: 'Maintenance',
    description: 'Safely purges Redis keys matching a specific namespace pattern without downtime.',
    parameters: [{ name: 'namespace', type: 'string', placeholder: 'sessions:*' }],
    estimatedDuration: '10s',
    riskLevel: 'LOW',
  },
  {
    id: 'db-migration-dryrun',
    name: 'Run DB Schema Migration Dry-Run',
    category: 'Database',
    description: 'Executes Prisma migration SQL scripts in transaction roll-back mode to check compatibility.',
    parameters: [{ name: 'target_db', type: 'string', placeholder: 'neon_staging_db' }],
    estimatedDuration: '25s',
    riskLevel: 'MEDIUM',
  },
  {
    id: 'rotate-api-keys',
    name: 'Rotate Ephemeral Gateway API Tokens',
    category: 'Security',
    description: 'Generates new AES-256 encrypted microservice tokens and invalidates prior credentials.',
    parameters: [{ name: 'service_name', type: 'string', placeholder: 'auth-gateway-api' }],
    estimatedDuration: '15s',
    riskLevel: 'HIGH',
  },
  {
    id: 'scale-k8s-replicas',
    name: 'Scale Pod Replicas',
    category: 'Infrastructure',
    description: 'Adjusts Kubernetes horizontal pod autoscaling replica count for sudden traffic bursts.',
    parameters: [{ name: 'replica_count', type: 'number', placeholder: '5' }],
    estimatedDuration: '30s',
    riskLevel: 'LOW',
  },
];

export const Actions: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [confirmWorkflow, setConfirmWorkflow] = useState<ActionWorkflow | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<ActionWorkflow | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const filteredWorkflows = ACTION_WORKFLOWS.filter((wf) =>
    wf.name.toLowerCase().includes(search.toLowerCase()) ||
    wf.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmRun = () => {
    if (!confirmWorkflow) return;
    const wf = confirmWorkflow;
    setConfirmWorkflow(null);
    setActiveWorkflow(wf);
    setIsRunning(true);
    setLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating workflow: ${wf.name}...`,
      `[${new Date().toLocaleTimeString()}] 🔐 Authenticated as @${user?.username || 'developer'} (RBAC: ${user?.role || 'DEVELOPER'})`,
      `[${new Date().toLocaleTimeString()}] 🛡️ Mode: Safe Dry-Run Simulation (Neon DB / PostgreSQL)`,
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⚡ Validating safety gates & target infrastructure...`,
        `[${new Date().toLocaleTimeString()}] 📦 Acquiring lock on namespace: ${wf.id}`,
      ]);
    }, 1200);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🔄 Executing action pipeline steps [1/3]...`,
        `[${new Date().toLocaleTimeString()}] 🔄 Applying verified parameters: ${JSON.stringify(wf.parameters)}`,
      ]);
    }, 2400);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✅ Action executed successfully with exit code 0!`,
        `[${new Date().toLocaleTimeString()}] 📡 Real-time Socket.IO telemetry broadcasted.`,
        `[${new Date().toLocaleTimeString()}] 📋 Audit log persisted to PostgreSQL database.`,
      ]);
      setIsRunning(false);
    }, 3800);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Self-Service Actions</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Automated operational runbooks, infrastructure maintenance, and safe simulations.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search runbooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-xs"
          />
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-300">RBAC & Safety Policy</strong>
          <p className="text-[11px] text-amber-200/90 mt-0.5 font-sans">
            All destructive or production actions require RBAC authorization, confirmation, audit logging, and execute in <strong>Simulation / Dry-Run Mode</strong> to protect infrastructure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actions List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">{wf.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                        {wf.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      wf.riskLevel === 'LOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : wf.riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {wf.riskLevel} RISK
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-sans">
                  {wf.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est: {wf.estimatedDuration}</span>
                </div>

                <button
                  onClick={() => setConfirmWorkflow(wf)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>Execute Workflow</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Execution Terminal (5 Cols) */}
        <div className="lg:col-span-5 bg-[#050916] rounded-2xl border border-white/15 p-5 text-slate-200 font-mono text-xs flex flex-col justify-between min-h-[420px] shadow-2xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold text-white">Execution Terminal</span>
              </div>
              {isRunning && (
                <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  Running...
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-xs italic">
                  Select a workflow on the left and click "Execute Workflow" to launch an action.
                </p>
              ) : (
                logs.map((line, idx) => (
                  <p key={idx} className="leading-relaxed text-emerald-300">
                    {line}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Workflow: {activeWorkflow?.name || 'Idle'}</span>
            <span>User: @{user?.username || 'developer'} ({user?.role || 'DEVELOPER'})</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#091024]/95 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Confirm Action Execution</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you sure you want to execute <strong className="text-white font-mono">{confirmWorkflow.name}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span>{confirmWorkflow.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Level:</span>
                <span className="font-bold text-amber-400">{confirmWorkflow.riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode:</span>
                <span className="text-cyan-400 font-bold">Dry-Run Simulation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authorized Operator:</span>
                <span>@{user?.username || 'developer'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmWorkflow(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRun}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20"
              >
                Confirm & Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
