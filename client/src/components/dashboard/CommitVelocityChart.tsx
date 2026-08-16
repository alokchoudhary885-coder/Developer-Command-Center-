import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CommitVelocityChartProps {
  data?: Array<{
    day: string;
    commits: number;
    prsMerged: number;
  }>;
}

const data7d = [
  { day: 'Mon', commits: 6, prsMerged: 2 },
  { day: 'Tue', commits: 14, prsMerged: 4 },
  { day: 'Wed', commits: 22, prsMerged: 7 },
  { day: 'Thu', commits: 18, prsMerged: 5 },
  { day: 'Fri', commits: 28, prsMerged: 9 },
  { day: 'Sat', commits: 8, prsMerged: 1 },
  { day: 'Sun', commits: 12, prsMerged: 3 },
];

const data30d = [
  { day: 'W1', commits: 64, prsMerged: 18 },
  { day: 'W2', commits: 82, prsMerged: 24 },
  { day: 'W3', commits: 98, prsMerged: 31 },
  { day: 'W4', commits: 114, prsMerged: 38 },
];

const data90d = [
  { day: 'Month 1', commits: 280, prsMerged: 76 },
  { day: 'Month 2', commits: 340, prsMerged: 98 },
  { day: 'Month 3', commits: 412, prsMerged: 124 },
];

export const CommitVelocityChart: React.FC<CommitVelocityChartProps> = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const activeData = range === '7d' ? data7d : range === '30d' ? data30d : data90d;

  return (
    <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Engineering Velocity</h3>
            <p className="text-[11px] font-mono text-slate-400">Commits vs Merged Pull Requests</p>
          </div>
        </div>

        {/* Range Controls & Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono font-bold">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  range === r
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400" />
              <span className="text-slate-300 text-[11px]">Commits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
              <span className="text-slate-300 text-[11px]">PRs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 h-[240px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="commitsGradCyber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prsGradCyber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#091024',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#ffffff',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
              }}
            />
            <Area
              type="monotone"
              dataKey="commits"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#commitsGradCyber)"
            />
            <Area
              type="monotone"
              dataKey="prsMerged"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#prsGradCyber)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
