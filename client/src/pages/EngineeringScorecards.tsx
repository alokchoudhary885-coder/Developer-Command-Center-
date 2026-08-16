import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

interface ScorecardRule {
  id: string;
  name: string;
  category: 'Security' | 'Reliability' | 'Observability' | 'Documentation';
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
  remediation?: string;
}

interface ServiceScorecard {
  serviceId: string;
  serviceName: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  score: number;
  badge: 'GOLD' | 'SILVER' | 'BRONZE';
  ownerTeam: string;
  rules: ScorecardRule[];
}

const SAMPLE_SCORECARDS: ServiceScorecard[] = [
  {
    serviceId: 'srv-checkout',
    serviceName: 'checkout-service',
    tier: 'Tier 1',
    score: 95,
    badge: 'GOLD',
    ownerTeam: 'Payments Core',
    rules: [
      { id: 'r1', name: 'Branch Protection (2 Approvers)', category: 'Security', status: 'PASS', detail: 'Main branch requires 2 code reviews and passing CI checks.' },
      { id: 'r2', name: 'Dependabot & Vulnerability Scanning', category: 'Security', status: 'PASS', detail: 'Zero critical or high CVE vulnerabilities detected.' },
      { id: 'r3', name: 'Distributed Tracing Instrumented', category: 'Observability', status: 'PASS', detail: 'OpenTelemetry traces connected to Jaeger/Datadog.' },
      { id: 'r4', name: 'OpenAPI Specification Published', category: 'Documentation', status: 'PASS', detail: 'Swagger docs auto-generated from controllers.' },
    ],
  },
  {
    serviceId: 'srv-telemetry',
    serviceName: 'telemetry-engine',
    tier: 'Tier 1',
    score: 82,
    badge: 'SILVER',
    ownerTeam: 'Platform Infra',
    rules: [
      { id: 'r1', name: 'Branch Protection (2 Approvers)', category: 'Security', status: 'PASS', detail: 'Main branch protected.' },
      { id: 'r2', name: 'Unit Test Coverage > 80%', category: 'Reliability', status: 'WARN', detail: 'Current test coverage is 74.2%. Needs 5.8% increase.', remediation: 'Add integration tests for WebSocket connection handler' },
      { id: 'r3', name: 'Production Health Endpoint', category: 'Observability', status: 'PASS', detail: 'GET /healthz returns HTTP 200 with DB ping.' },
      { id: 'r4', name: 'Service Runbook Documented', category: 'Documentation', status: 'PASS', detail: 'On-call runbook linked in Software Catalog.' },
    ],
  },
  {
    serviceId: 'srv-auth',
    serviceName: 'auth-gateway-api',
    tier: 'Tier 1',
    score: 98,
    badge: 'GOLD',
    ownerTeam: 'Security & Auth',
    rules: [
      { id: 'r1', name: 'AES-256 Token Encryption', category: 'Security', status: 'PASS', detail: 'GitHub & Google OAuth tokens encrypted with AES-256-GCM.' },
      { id: 'r2', name: 'Rate Limiting Enforced', category: 'Security', status: 'PASS', detail: 'IP throttle and DDoS limit of 100 req/min.' },
      { id: 'r3', name: 'Audit Logging Active', category: 'Observability', status: 'PASS', detail: 'All auth attempts logged to PostgreSQL with sanitized IPs.' },
      { id: 'r4', name: 'Zero Stale Dependencies', category: 'Reliability', status: 'PASS', detail: 'All npm packages audited with 0 vulnerabilities.' },
    ],
  },
  {
    serviceId: 'srv-frontend',
    serviceName: 'customer-portal-web',
    tier: 'Tier 2',
    score: 76,
    badge: 'BRONZE',
    ownerTeam: 'Frontend & UI',
    rules: [
      { id: 'r1', name: 'Bundle Size < 500KB', category: 'Reliability', status: 'WARN', detail: 'Main bundle is 975KB minified. Needs chunk splitting.', remediation: 'Configure Vite dynamic import() for heavy chart components' },
      { id: 'r2', name: 'E2E Testing in CI', category: 'Reliability', status: 'FAIL', detail: 'Playwright smoke tests disabled on pull requests.', remediation: 'Enable GitHub Actions Playwright test workflow' },
      { id: 'r3', name: 'Sentry Error Monitoring', category: 'Observability', status: 'PASS', detail: 'React Error Boundaries pipe exceptions to Sentry.' },
      { id: 'r4', name: 'Component Library Documentation', category: 'Documentation', status: 'PASS', detail: 'Storybook deployed to internal docs portal.' },
    ],
  },
];

export const EngineeringScorecards: React.FC = () => {
  const [selectedService, setSelectedService] = useState<ServiceScorecard>(SAMPLE_SCORECARDS[0]);
  const [search, setSearch] = useState<string>('');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const filtered = SAMPLE_SCORECARDS.filter((s) =>
    s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerTeam.toLowerCase().includes(search.toLowerCase())
  );

  const handleAskAIAdvice = async (service: ServiceScorecard) => {
    try {
      setIsAiLoading(true);
      setAiAdvice(null);
      const res = await api.post('/ai/ask', {
        query: `Analyze engineering readiness scorecard for ${service.serviceName} (Score: ${service.score}% - Badge: ${service.badge}). Rules: ${service.rules.map(r => `${r.name}: ${r.status} (${r.detail})`).join(', ')}. Give a concise 3-step prioritized remediation advice for the engineering manager.`,
      });
      if (res.data.success) {
        setAiAdvice(res.data.answer);
      }
    } catch (err) {
      setAiAdvice('❌ AI advice unavailable. Ensure Gemini API key is configured.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Engineering Scorecards</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Continuous production readiness audits, security baselines, and AI-driven remediation guidance.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-xs"
          />
        </div>
      </div>

      {/* Main Grid: Services List (5 Cols) + Selected Service Audit Rules (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Services List Column */}
        <div className="lg:col-span-5 space-y-3">
          {filtered.map((svc) => (
            <div
              key={svc.serviceId}
              onClick={() => {
                setSelectedService(svc);
                setAiAdvice(null);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xl ${
                selectedService.serviceId === svc.serviceId
                  ? 'bg-[#0e1b3d]/90 border-cyan-400/50 ring-1 ring-cyan-400/20'
                  : 'bg-[#0c1532]/75 backdrop-blur-xl border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">{svc.serviceName}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300 border border-white/15">
                      {svc.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-sans">Owned by {svc.ownerTeam}</p>
                </div>

                <div className="text-right font-mono">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      svc.badge === 'GOLD'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : svc.badge === 'SILVER'
                        ? 'bg-slate-500/20 text-slate-200 border border-slate-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}
                  >
                    {svc.badge} ({svc.score}%)
                  </span>
                </div>
              </div>

              {/* Mini meter */}
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    svc.score >= 90
                      ? 'bg-emerald-500'
                      : svc.score >= 80
                      ? 'bg-cyan-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${svc.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Selected Service Audit Rules (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  {selectedService.serviceName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedService.tier}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Owner: <strong className="text-white">{selectedService.ownerTeam}</strong> • Overall Score: <strong className="text-emerald-400">{selectedService.score}%</strong>
              </p>
            </div>

            <button
              onClick={() => handleAskAIAdvice(selectedService)}
              disabled={isAiLoading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Analyzing...' : 'Ask AI Remediation'}</span>
            </button>
          </div>

          {/* AI Scorecard Advice Banner */}
          {aiAdvice && (
            <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-purple-300 font-bold font-mono">
                <Sparkles className="w-4 h-4" />
                <span>AI Engineering Recommendation</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed text-slate-200 font-sans">{aiAdvice}</div>
            </div>
          )}

          {/* Rules Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Production Standards Audit Rules ({selectedService.rules.length})
            </h4>

            {selectedService.rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {rule.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : rule.status === 'WARN' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rule.name}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-white/10 border border-white/15 text-slate-300">
                        {rule.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{rule.detail}</p>
                    {rule.remediation && (
                      <p className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20 mt-1">
                        👉 Action: {rule.remediation}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                    rule.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : rule.status === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
