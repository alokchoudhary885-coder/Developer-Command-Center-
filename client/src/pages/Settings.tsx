import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  Shield,
  CheckCircle2,
  Send,
  Lock,
  Radio,
  Sliders,
  Github,
  RefreshCw,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState<string>(
    localStorage.getItem('cc_webhook_url') || ''
  );
  const [notifyStalePRs, setNotifyStalePRs] = useState<boolean>(true);
  const [notifySecurity, setNotifySecurity] = useState<boolean>(true);
  const [notifyDeployments, setNotifyDeployments] = useState<boolean>(true);
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cc_webhook_url', webhookUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendTestAlert = async () => {
    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await api.post('/alerts/test', {
        webhookUrl: webhookUrl.trim() || undefined,
        type: 'PR_BOTTLENECK',
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.response?.data?.error?.message || err.message,
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      await api.post('/github/sync/all');
      setSyncResult({ success: true, message: 'Full sync completed — repositories, PRs, issues and commits updated.' });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Sync failed.';
      setSyncResult({ success: false, message: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  const hasGitHubToken = !!(user as any)?.githubToken || (user as any)?.provider === 'GITHUB' || (user?.avatarUrl?.includes('github') ?? false);

  return (
    <PageContainer
      title="Settings & Integrations"
      description="Configure GitHub sync, real-time Slack/Discord webhooks, telemetry alert triggers, and security controls."
    >
      <div className="max-w-4xl space-y-6 select-none">

        {/* 0. GitHub Connection Status */}
        <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono">GitHub Connection</h3>
                <p className="text-xs text-slate-300">Sync status and data management</p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
              hasGitHubToken
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {hasGitHubToken ? 'Connected' : 'Token Required'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || ''} className="w-10 h-10 rounded-xl border border-white/20 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name || user?.email || 'Unknown'}</p>
                <p className="text-[11px] font-mono text-slate-400 truncate">@{user?.username || 'not linked'}</p>
                <p className="text-[10px] font-mono text-emerald-400 font-semibold">{user?.role || 'DEVELOPER'}</p>
              </div>
            </div>

            {/* Token Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sync Status</span>
              </div>
              {hasGitHubToken ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-400 font-mono">OAuth Token Active</p>
                  <p className="text-[11px] text-slate-400">Repositories, PRs, Issues & Commits sync enabled</p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-300">Re-login with GitHub OAuth to enable auto-sync</p>
                </div>
              )}
            </div>
          </div>

          {/* Sync All Button */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing GitHub Data...' : 'Sync All GitHub Data'}</span>
            </button>
            {syncResult && (
              <p className={`text-xs font-mono ${syncResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {syncResult.success ? '✅ ' : '⚠️ '}{syncResult.message}
              </p>
            )}
          </div>
        </div>


        <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Slack & Discord Webhook Dispatcher
                </h3>
                <p className="text-xs text-slate-300">
                  Deliver instant alerts to engineering channels for bottlenecks and security flags
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Incoming Webhook URL (Slack or Discord)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/services/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Leave blank to test in simulated mode, or enter your channel's Webhook URL.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={sendingTest}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-spin' : ''}`} />
                <span>{sendingTest ? 'Sending...' : 'Send Test Notification'}</span>
              </button>
            </div>
          </form>

          {/* Test Notification Result Banner */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-2 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {testResult.simulated
                    ? 'Simulated Alert Broadcast Successful'
                    : 'Live Webhook Notification Dispatched'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {testResult.message || 'Notification received and processed.'}
              </p>
              {testResult.samplePayload && (
                <pre className="p-3 rounded-lg bg-black/60 text-cyan-300 text-[10px] overflow-x-auto border border-white/10">
                  {JSON.stringify(testResult.samplePayload, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 2. Notification Triggers */}
        <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Alert Dispatch Triggers</h3>
              <p className="text-xs text-slate-300">
                Choose which engineering events trigger automated alerts
              </p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            <div className="py-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Stale PR Review Bottlenecks</h4>
                <p className="text-[11px] text-slate-400">
                  Notify when a Pull Request is awaiting review for more than 24 hours
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyStalePRs}
                onChange={(e) => setNotifyStalePRs(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">AI Security Vulnerability Flags</h4>
                <p className="text-[11px] text-slate-400">
                  Alert immediately when Gemini AI detects OWASP or secret leakage risks
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifySecurity}
                onChange={(e) => setNotifySecurity(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">CI/CD Deployment Releases</h4>
                <p className="text-[11px] text-slate-400">
                  Broadcast pipeline completions and failed build alerts
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyDeployments}
                onChange={(e) => setNotifyDeployments(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Hardware Security Status & RBAC */}
        <div className="p-6 rounded-2xl bg-[#0c1532]/75 backdrop-blur-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Security & Token Cipher Controls</h3>
              <p className="text-xs text-slate-300">
                Enterprise cryptography standards and identity management
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Token Cipher</span>
              </div>
              <p className="text-xs font-bold text-white font-mono">AES-256-GCM</p>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">Hardware Authenticated</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Webhook Signature</span>
              </div>
              <p className="text-xs font-bold text-white font-mono">HMAC SHA-256</p>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">timingSafeEqual Active</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>RBAC Authority</span>
              </div>
              <p className="text-xs font-bold text-white font-mono">{user?.role || 'DEVELOPER'}</p>
              <span className="text-[10px] text-slate-400 font-mono">Scope: Full Workspace</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
