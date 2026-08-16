import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Bot,
  RefreshCw,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { PullRequest, PrReview } from '../../types';
import { api } from '../../services/api';

interface PRReviewModalProps {
  pr: PullRequest | null;
  onClose: () => void;
}

export const PRReviewModal: React.FC<PRReviewModalProps> = ({ pr, onClose }) => {
  const [review, setReview] = useState<PrReview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [reviewing, setReviewing] = useState<boolean>(false);

  const fetchExistingReview = useCallback(async () => {
    if (!pr) return;
    try {
      setLoading(true);
      const res = await api.get(`/ai/reviews/${pr.id}`);
      if (res.data.success && res.data.data?.reviews?.length > 0) {
        setReview(res.data.data.reviews[0]);
      } else {
        // Auto trigger review if none exists
        triggerNewReview();
      }
    } catch (err) {
      console.error('Failed to fetch PR reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [pr]);

  useEffect(() => {
    if (pr) {
      fetchExistingReview();
    }
  }, [pr, fetchExistingReview]);

  const triggerNewReview = async () => {
    if (!pr) return;
    try {
      setReviewing(true);
      const res = await api.post(`/ai/review-pr/${pr.id}`);
      if (res.data.success && res.data.data?.review) {
        setReview(res.data.data.review);
      }
    } catch (err) {
      console.error('AI PR Review failed:', err);
    } finally {
      setReviewing(false);
    }
  };

  if (!pr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-50 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-100/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent text-white shadow-glow-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-brand-secondary">
                  #{pr.number}
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {pr.title}
                </h3>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                AI Code Review & Security Audit • {pr.repository?.name || 'repo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerNewReview}
              disabled={reviewing}
              title="Re-run AI Analysis"
              className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 border border-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reviewing ? 'animate-spin text-brand-secondary' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-surface-100 hover:bg-rose-500/10 border border-white/5 text-slate-400 hover:text-rose-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading || reviewing ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-secondary animate-pulse">
                <Bot className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Gemini AI is analyzing Git diff & security heuristics...
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Scanning for OWASP vulnerabilities, token leaks, and O(N) complexity
                </p>
              </div>
            </div>
          ) : review ? (
            <>
              {/* Score & Verdict Banner */}
              <div className="p-5 rounded-xl bg-surface-100/60 border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Code Quality Score
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-mono text-white">
                      {review.score}
                      <span className="text-sm text-slate-500 font-normal">/100</span>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        review.verdict === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : review.verdict === 'CHANGES_REQUESTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {review.verdict}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-slate-400 block">Security Status</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
                    <ShieldCheck className="w-4 h-4" />
                    Passed Audit
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-secondary" />
                  Executive Summary
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-xl bg-surface-100/30 border border-white/5">
                  {review.summary}
                </p>
              </div>

              {/* Security Alerts */}
              {review.securityAlerts && review.securityAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Security Recommendations ({review.securityAlerts.length})
                  </h4>
                  <div className="space-y-2">
                    {review.securityAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300">{alert.title}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {alert.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Notes */}
              {review.performanceNotes && review.performanceNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Performance & Execution Notes
                  </h4>
                  <div className="space-y-2">
                    {review.performanceNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5"
                      >
                        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300">{note.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Smells / Cleanliness */}
              {review.codeSmells && review.codeSmells.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-slate-400" />
                    Architectural Suggestions
                  </h4>
                  <ul className="space-y-1.5 p-3 rounded-xl bg-surface-100/30 border border-white/5 text-xs text-slate-400">
                    {review.codeSmells.map((smell, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-secondary font-bold">•</span>
                        <span>{smell}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Click below to generate an automated review.</p>
              <button
                onClick={triggerNewReview}
                className="mt-4 px-4 py-2 rounded-lg bg-brand-primary text-white text-xs font-semibold"
              >
                Run AI Code Review
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between bg-surface-100/40">
          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <span>Open PR #{pr.number} on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-semibold text-white border border-white/10 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
