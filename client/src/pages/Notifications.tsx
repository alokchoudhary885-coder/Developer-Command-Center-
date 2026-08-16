import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  GitPullRequest,
  Rocket,
  Shield,
  Clock,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'BOTTLENECK' | 'SECURITY' | 'DEPLOY' | 'INFO';
  read: boolean;
  timestamp: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'PR Bottleneck Alert',
    message: 'Pull Request #42 "Implement OAuth2 PKCE Flow" in auth-gateway-api has exceeded the 24h review threshold (34h waiting).',
    type: 'BOTTLENECK',
    read: false,
    timestamp: '10m ago',
  },
  {
    id: 'notif-2',
    title: 'Production Deployment Succeeded',
    message: 'checkout-service (v2.8.4) was successfully deployed to Production cluster by Alok Choudhary.',
    type: 'DEPLOY',
    read: false,
    timestamp: '25m ago',
  },
  {
    id: 'notif-3',
    title: 'AI Security Audit Warning',
    message: 'Gemini AI flagged potential missing input sanitization in payment callback webhook route.',
    type: 'SECURITY',
    read: true,
    timestamp: '2h ago',
  },
  {
    id: 'notif-4',
    title: 'DORA Benchmark Upgrade',
    message: 'Your team reached ELITE status on Deployment Frequency with 18 releases in the last 7 days.',
    type: 'INFO',
    read: true,
    timestamp: '1d ago',
  },
];

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Notifications Center</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            System alerts, PR bottleneck triggers, AI security flags, and deployment releases.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-slate-200 text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notif) => {
          return (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-xl ${
                notif.read
                  ? 'bg-[#0c1532]/60 border-white/5 opacity-75'
                  : 'bg-[#0e1b3d]/90 border-cyan-400/40 ring-1 ring-cyan-400/20'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                    notif.type === 'BOTTLENECK'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : notif.type === 'SECURITY'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : notif.type === 'DEPLOY'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {notif.type === 'BOTTLENECK' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : notif.type === 'SECURITY' ? (
                    <Shield className="w-4 h-4" />
                  ) : notif.type === 'DEPLOY' ? (
                    <Rocket className="w-4 h-4" />
                  ) : (
                    <GitPullRequest className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{notif.message}</p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{notif.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
