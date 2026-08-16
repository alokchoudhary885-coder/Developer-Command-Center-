import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'emerald' | 'purple' | 'cyan' | 'amber' | 'rose';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'emerald',
}) => {
  const colorMap = {
    emerald: {
      box: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    purple: {
      box: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
      text: 'text-purple-400',
    },
    cyan: {
      box: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
      text: 'text-cyan-400',
    },
    amber: {
      box: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      text: 'text-amber-400',
    },
    rose: {
      box: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
      text: 'text-rose-400',
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <div className="p-5 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 shadow-xl transition-all duration-300 group hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${currentTheme.box} shadow-xs`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                : 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 mt-1 font-mono">{subtitle}</p>}
    </div>
  );
};
