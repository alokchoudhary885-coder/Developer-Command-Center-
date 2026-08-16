import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trophy,
  Activity,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { PageContainer } from '../components/layout/PageContainer';
import { api } from '../services/api';

export const DoraMetrics: React.FC = () => {
  const [doraData, setDoraData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoraMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dora');
      if (res.data.success) {
        setDoraData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load DORA metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoraMetrics();
  }, []);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ELITE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            ELITE
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            LOW
          </span>
        );
    }
  };

  const chartData = [
    { day: 'Mon', deploys: 4, leadTime: 3.2 },
    { day: 'Tue', deploys: 6, leadTime: 2.8 },
    { day: 'Wed', deploys: 8, leadTime: 2.1 },
    { day: 'Thu', deploys: 5, leadTime: 2.4 },
    { day: 'Fri', deploys: 9, leadTime: 1.8 },
    { day: 'Sat', deploys: 2, leadTime: 1.2 },
    { day: 'Sun', deploys: 3, leadTime: 1.5 },
  ];

  return (
    <PageContainer
      title="DORA Engineering Metrics"
      description="DevOps Research & Assessment (DORA) benchmarks evaluating delivery velocity and stability."
      action={
        <button
          onClick={fetchDoraMetrics}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 shadow-xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      }
    >
      {loading ? (
        <div className="space-y-6">
          <div className="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        </div>
      ) : doraData ? (
        <div className="space-y-6">
          {/* 1. Elite Performer Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-400/30">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-amber-300">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Overall DORA Rating: {doraData.overallTier} PERFORMER
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-300/30">
                    Score: {doraData.overallScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-sans">
                  Your engineering team operates in the top 5% benchmark for continuous delivery velocity and service recovery.
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-black/25 backdrop-blur-md border border-white/20 text-xs font-mono text-emerald-200">
              <span className="text-emerald-300 font-bold">✓ 4 of 4 Metrics</span> Meeting Elite SLAs
            </div>
          </div>

          {/* 2. The 4 Core DORA Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Deployment Frequency */}
            <div className="p-5 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <Zap className="w-5 h-5" />
                </div>
                {getTierBadge(doraData.deploymentFrequency.tier)}
              </div>
              <div>
                <span className="text-xs font-mono text-slate-400 block">Deployment Frequency</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {doraData.deploymentFrequency.value}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {doraData.deploymentFrequency.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 font-mono">
                  {doraData.deploymentFrequency.benchmark}
                </p>
              </div>
            </div>

            {/* Metric 2: Lead Time for Changes */}
            <div className="p-5 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
                {getTierBadge(doraData.leadTimeForChanges.tier)}
              </div>
              <div>
                <span className="text-xs font-mono text-slate-400 block">Lead Time for Changes</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {doraData.leadTimeForChanges.value}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {doraData.leadTimeForChanges.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 font-mono">
                  {doraData.leadTimeForChanges.benchmark}
                </p>
              </div>
            </div>

            {/* Metric 3: Change Failure Rate */}
            <div className="p-5 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                {getTierBadge(doraData.changeFailureRate.tier)}
              </div>
              <div>
                <span className="text-xs font-mono text-slate-400 block">Change Failure Rate</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {doraData.changeFailureRate.value}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 font-mono">
                  {doraData.changeFailureRate.benchmark}
                </p>
              </div>
            </div>

            {/* Metric 4: Mean Time to Recovery */}
            <div className="p-5 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                {getTierBadge(doraData.meanTimeToRecovery.tier)}
              </div>
              <div>
                <span className="text-xs font-mono text-slate-400 block">Mean Time to Recovery</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {doraData.meanTimeToRecovery.value}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {doraData.meanTimeToRecovery.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 font-mono">
                  {doraData.meanTimeToRecovery.benchmark}
                </p>
              </div>
            </div>
          </div>

          {/* 3. DORA Velocity Trend Chart & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">7-Day DORA Velocity & Lead Time</h4>
                  <p className="text-xs text-slate-400">Continuous deployment rhythm vs cycle time</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Deployments
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Lead Time (hrs)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="doraDeployCyber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="doraLeadCyber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#091024',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="deploys"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#doraDeployCyber)"
                    />
                    <Area
                      type="monotone"
                      dataKey="leadTime"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#doraLeadCyber)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendations Column */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Continuous Delivery Recommendations</h4>
              </div>

              <div className="space-y-3">
                {doraData.recommendations.map((rec: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed font-sans"
                  >
                    {rec}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>DORA benchmark tier is re-evaluated with every webhook push event.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};
