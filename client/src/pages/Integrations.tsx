import React from 'react';
import {
  Layers,
  Bot,
  MessageSquare,
  Radio,
  Clock,
  Zap,
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  category: 'VCS' | 'AI / LLM' | 'Alerting' | 'Incident' | 'Cloud';
  description: string;
  status: 'CONNECTED' | 'AVAILABLE';
  icon: any;
  color: string;
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'github',
    name: 'GitHub Enterprise / Cloud',
    category: 'VCS',
    description: 'Repository sync, pull request webhooks, commit streaming, and issue resolution SLAs.',
    status: 'CONNECTED',
    icon: Radio,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  {
    id: 'gemini',
    name: 'Google Gemini 1.5 Flash',
    category: 'AI / LLM',
    description: 'AI code review generation, security risk audits, and natural language telemetry queries.',
    status: 'CONNECTED',
    icon: Bot,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  },
  {
    id: 'slack',
    name: 'Slack Webhooks & Bot',
    category: 'Alerting',
    description: 'Broadcast review bottlenecks, critical security flags, and sprint summaries into channels.',
    status: 'CONNECTED',
    icon: MessageSquare,
    color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  },
  {
    id: 'discord',
    name: 'Discord Webhook Dispatcher',
    category: 'Alerting',
    description: 'Real-time engineering notifications and deployment release announcements.',
    status: 'CONNECTED',
    icon: MessageSquare,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  {
    id: 'sentry',
    name: 'Sentry Error Monitoring',
    category: 'Incident',
    description: 'Runtime exception telemetry, crash reporting, and frontend boundary stack traces.',
    status: 'AVAILABLE',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  },
  {
    id: 'aws',
    name: 'AWS CloudWatch & ECS',
    category: 'Cloud',
    description: 'Container health metrics, CPU/memory saturation, and auto-scaling group events.',
    status: 'AVAILABLE',
    icon: Clock,
    color: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  },
];

export const Integrations: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Integrations Hub</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Connect developer tools, VCS webhooks, AI copilots, and incident management systems.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>4 Connected Services</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      item.status === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-slate-300 border border-white/15'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3 font-mono">{item.name}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-slate-400">
                  Category: {item.category}
                </span>

                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    item.status === 'CONNECTED'
                      ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs'
                  }`}
                >
                  {item.status === 'CONNECTED' ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
