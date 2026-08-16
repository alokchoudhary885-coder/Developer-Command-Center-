import React, { useState } from 'react';
import {
  Users,
  FolderGit2,
  Search,
} from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

interface EngineeringTeam {
  id: string;
  name: string;
  lead: string;
  slackChannel: string;
  members: TeamMember[];
  ownedServices: string[];
  openPRsCount: number;
  openIssuesCount: number;
}

const SAMPLE_TEAMS: EngineeringTeam[] = [
  {
    id: 'team-payments',
    name: 'Payments Core',
    lead: 'Alok Choudhary',
    slackChannel: '#team-payments-core',
    members: [
      { name: 'Alok Choudhary', role: 'Staff Engineer', avatar: 'AC' },
      { name: 'David Kim', role: 'Senior Backend Engineer', avatar: 'DK' },
      { name: 'Elena Rostova', role: 'DevOps Engineer', avatar: 'ER' },
    ],
    ownedServices: ['checkout-service', 'billing-ledger-db', 'stripe-webhook-gateway'],
    openPRsCount: 3,
    openIssuesCount: 4,
  },
  {
    id: 'team-platform',
    name: 'Platform & Infra',
    lead: 'Marcus Vance',
    slackChannel: '#team-platform-infra',
    members: [
      { name: 'Marcus Vance', role: 'Principal Architect', avatar: 'MV' },
      { name: 'Sara Lin', role: 'SRE / Infra Engineer', avatar: 'SL' },
    ],
    ownedServices: ['telemetry-engine', 'kubernetes-cluster-config', 'redis-cluster-manager'],
    openPRsCount: 2,
    openIssuesCount: 2,
  },
  {
    id: 'team-security',
    name: 'Security & Auth',
    lead: 'Priya Sharma',
    slackChannel: '#team-security-auth',
    members: [
      { name: 'Priya Sharma', role: 'Security Lead', avatar: 'PS' },
      { name: 'Tom Wilson', role: 'AppSec Engineer', avatar: 'TW' },
    ],
    ownedServices: ['auth-gateway-api', 'vault-token-rotator', 'audit-logger-worker'],
    openPRsCount: 1,
    openIssuesCount: 1,
  },
  {
    id: 'team-frontend',
    name: 'Frontend & UI Systems',
    lead: 'Chloe Bennett',
    slackChannel: '#team-frontend-ui',
    members: [
      { name: 'Chloe Bennett', role: 'Design Systems Lead', avatar: 'CB' },
      { name: 'Alex Rivera', role: 'Staff Frontend Engineer', avatar: 'AR' },
    ],
    ownedServices: ['customer-portal-web', 'component-ui-library', 'docs-developer-hub'],
    openPRsCount: 4,
    openIssuesCount: 3,
  },
];

export const Teams: React.FC = () => {
  const [search, setSearch] = useState<string>('');

  const filteredTeams = SAMPLE_TEAMS.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.lead.toLowerCase().includes(search.toLowerCase()) ||
    team.ownedServices.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Teams & Ownership Directory</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Service ownership mapping, engineering squad leads, and cross-functional team boundaries.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, leads, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-xs"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-5 group hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{team.name}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 font-sans">
                    Lead: <strong className="text-white">{team.lead}</strong> • Slack:{' '}
                    <span className="text-cyan-400 font-mono font-semibold">{team.slackChannel}</span>
                  </p>
                </div>

                <div className="flex items-center -space-x-2">
                  {team.members.map((m, idx) => (
                    <div
                      key={idx}
                      title={`${m.name} (${m.role})`}
                      className="w-7 h-7 rounded-full bg-cyan-500/20 border-2 border-[#0c1532] flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300 shadow-xs"
                    >
                      {m.avatar}
                    </div>
                  ))}
                </div>
              </div>

              {/* Owned Services Pills */}
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Owned Microservices & Components ({team.ownedServices.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {team.ownedServices.map((svc) => (
                    <span
                      key={svc}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 text-slate-200 border border-white/10 flex items-center gap-1.5 hover:border-cyan-400/40 transition-colors"
                    >
                      <FolderGit2 className="w-3 h-3 text-cyan-400" />
                      <span>{svc}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Health Stats */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4 text-slate-400">
                <span>
                  <strong className="text-emerald-400 font-bold">{team.openPRsCount}</strong> Active PRs
                </span>
                <span>•</span>
                <span>
                  <strong className="text-rose-400 font-bold">{team.openIssuesCount}</strong> Open Issues
                </span>
              </div>

              <button className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-all">
                View Squad
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
