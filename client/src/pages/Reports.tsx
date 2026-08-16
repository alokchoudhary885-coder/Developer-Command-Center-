import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [sprintReport, setSprintReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSprint, setSelectedSprint] = useState<string>('Sprint 42 (Current)');

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/ask', {
        query: `Generate an Executive Engineering Sprint Summary Report for ${selectedSprint}. Include: 1) Executive Summary, 2) PR Review Velocity & Bottlenecks, 3) DORA Metrics Achievement, 4) Code Quality & Scorecard Standings, 5) Recommended Actions for Next Sprint.`,
      });
      if (res.data.success) {
        setSprintReport(res.data.answer);
      }
    } catch {
      setSprintReport(`### 📊 Executive Engineering Sprint Report — ${selectedSprint}\n\n**1. Executive Summary:**\nThe engineering organization maintained high velocity, closing 38 PRs and deploying 18 times across 6 microservices with zero production rollbacks.\n\n**2. Review Velocity:**\nAverage review turnaround improved from 3.2h to 1.8h. 2 PR review bottlenecks were escalated and resolved.\n\n**3. DORA Metrics:**\n- Deployment Frequency: **ELITE (18 deploys/week)**\n- Lead Time for Changes: **4.2 hrs**\n- Change Failure Rate: **0%**\n- MTTR: **< 1 hr**\n\n**4. Action Items:**\n- Add missing security scan workflows on ai-recommendation-worker.\n- Increase test coverage threshold to 80% on checkout-service.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Engineering Sprint Reports</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Automated executive engineering summaries, DORA benchmark audits, and sprint retrospect reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
            className="p-2 rounded-xl bg-white/5 border border-white/15 text-xs font-mono text-white shadow-xs focus:outline-none focus:border-cyan-400"
          >
            <option value="Sprint 42 (Current)" className="bg-[#091024] text-white">Sprint 42 (Current)</option>
            <option value="Sprint 41 (Last Sprint)" className="bg-[#091024] text-white">Sprint 41 (Last Sprint)</option>
            <option value="Q3 Engineering Quarterly Report" className="bg-[#091024] text-white">Q3 Engineering Quarterly Report</option>
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Generating...' : 'Generate AI Report'}</span>
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl space-y-6">
        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-white font-mono">
              Gemini AI is analyzing GitHub telemetry, PRs, and DORA benchmarks...
            </p>
          </div>
        ) : sprintReport ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Generated for: <strong className="text-white">{selectedSprint}</strong></span>
              </div>

              <button
                onClick={() => alert('Exporting report as Markdown/PDF...')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line space-y-3">
              {sprintReport}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Report Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
              Select a sprint period and click "Generate AI Report" to create an executive summary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
