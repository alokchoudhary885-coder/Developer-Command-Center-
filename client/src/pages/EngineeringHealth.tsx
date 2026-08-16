import React from 'react';
import {
  Activity,
  HeartPulse,
  AlertTriangle,
  GitPullRequest,
} from 'lucide-react';

interface HealthDimension {
  id: string;
  name: string;
  score: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  description: string;
  metrics: string[];
}

const HEALTH_DIMENSIONS: HealthDimension[] = [
  {
    id: 'pr-throughput',
    name: 'PR Velocity & Throughput',
    score: 94,
    status: 'EXCELLENT',
    description: 'Average time from PR creation to first review and merge across all repos.',
    metrics: ['Avg Time to Merge: 4.2 hrs', 'Stale PRs (>24h): 2 items', 'Review Latency: 1.8 hrs'],
  },
  {
    id: 'code-review-culture',
    name: 'Review Balance & Distribution',
    score: 88,
    status: 'GOOD',
    description: 'Measures peer review participation and avoiding single-reviewer bottlenecks.',
    metrics: ['Avg Comments per PR: 3.4', 'Review Participation: 89%', 'Unreviewed PRs: 5%'],
  },
  {
    id: 'ci-stability',
    name: 'CI/CD Pipeline Reliability',
    score: 96,
    status: 'EXCELLENT',
    description: 'Build success rates and deployment rollback frequency.',
    metrics: ['Pipeline Pass Rate: 96.2%', 'Avg Build Time: 42s', 'Rollbacks (30d): 0'],
  },
  {
    id: 'issue-sla',
    name: 'Issue & Incident Resolution SLA',
    score: 82,
    status: 'GOOD',
    description: 'Time to acknowledge and resolve reported customer and internal defects.',
    metrics: ['Mean Time to Resolve: 6.8 hrs', 'Open Blockers: 1 item', 'SLA Adherence: 91%'],
  },
];

export const EngineeringHealth: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Engineering Health & Bottlenecks</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Holistic engineering operational health, code review latency radar, and team velocity metrics.
          </p>
        </div>

        {/* Global Score Badge */}
        <div className="flex items-center gap-3 bg-[#0c1532]/75 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-xl self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Overall Health</span>
            <span className="text-xl font-black font-mono text-emerald-400">92 / 100</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {HEALTH_DIMENSIONS.map((dim) => (
          <div
            key={dim.id}
            className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{dim.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{dim.description}</p>
                </div>
                <div className="text-right font-mono shrink-0 ml-3">
                  <span className="text-xl font-black text-white">{dim.score}%</span>
                  <span
                    className={`block text-[10px] font-bold ${
                      dim.status === 'EXCELLENT' ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  >
                    {dim.status}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    dim.score >= 90
                      ? 'bg-emerald-500'
                      : dim.score >= 80
                      ? 'bg-cyan-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>

            {/* Metrics List */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
              {dim.metrics.map((m, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                  {m}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PR Bottlenecks Radar Banner */}
      <div className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Review Bottleneck Radar</h3>
              <p className="text-[11px] font-mono text-slate-400">PRs waiting &gt;24 hours for review</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            2 Alerts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 border border-white/15 text-cyan-400">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">#42 Implement OAuth2 PKCE Flow</p>
                <span className="text-[11px] font-mono text-slate-400">auth-gateway-api • 34h waiting</span>
              </div>
            </div>
            <button className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold border border-cyan-500/30">
              Ping Reviewers
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 border border-white/15 text-cyan-400">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">#19 Add Redis caching to inventory query</p>
                <span className="text-[11px] font-mono text-slate-400">checkout-service • 26h waiting</span>
              </div>
            </div>
            <button className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold border border-cyan-500/30">
              Ping Reviewers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
