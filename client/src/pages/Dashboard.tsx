import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2,
  GitPullRequest,
  AlertCircle,
  Activity,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/dashboard/MetricCard';
import { PRBottlenecks } from '../components/dashboard/PRBottlenecks';
import { CommitVelocityChart } from '../components/dashboard/CommitVelocityChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { DeploymentHealth } from '../components/dashboard/DeploymentHealth';
import { useSocket, ActivityEvent } from '../hooks/useSocket';
import { api } from '../services/api';
import { Repository, PullRequest, ActivityLog } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [reposRes, prsRes, actRes] = await Promise.allSettled([
        api.get('/github/repositories'),
        api.get('/github/pull-requests?state=OPEN'),
        api.get('/github/activity'),
      ]);

      if (reposRes.status === 'fulfilled' && reposRes.value.data.success) {
        const repoList =
          reposRes.value.data.data?.repositories ||
          reposRes.value.data.data ||
          [];
        setRepositories(Array.isArray(repoList) ? repoList : []);
      }
      if (prsRes.status === 'fulfilled' && prsRes.value.data.success) {
        const prList =
          prsRes.value.data.data?.pullRequests ||
          prsRes.value.data.data ||
          [];
        setPullRequests(Array.isArray(prList) ? prList : []);
      }
      if (actRes.status === 'fulfilled' && actRes.value.data.success) {
        const actList =
          actRes.value.data.data?.activities ||
          actRes.value.data.data ||
          [];
        setActivities(Array.isArray(actList) ? actList : []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleSynced = () => fetchDashboardData();
    window.addEventListener('telemetry-synced', handleSynced);
    return () => window.removeEventListener('telemetry-synced', handleSynced);
  }, [fetchDashboardData]);

  // Handle Live Real-time Socket.IO Events
  const handleRealtimeActivity = (event: ActivityEvent) => {
    const newLog: ActivityLog = {
      id: `live_${Date.now()}`,
      action: event.action,
      entityType: event.type,
      metadata: event.metadata || { title: event.title, author: event.actor },
      createdAt: event.timestamp || new Date().toISOString(),
      repository: { name: event.repositoryName || 'repo', fullName: event.repositoryName || 'repo' },
    };

    setActivities((prev) => [newLog, ...prev.slice(0, 19)]);

    if (event.type === 'PULL_REQUEST') {
      api.get('/github/pull-requests?state=OPEN').then((res) => {
        if (res.data.success) {
          const list = res.data.data?.pullRequests || res.data.data || [];
          setPullRequests(Array.isArray(list) ? list : []);
        }
      });
    }
  };

  useSocket(handleRealtimeActivity);

  const openIssuesCount = repositories.reduce((acc, r) => acc + (r.openIssuesCount || 0), 0);
  const totalStars = repositories.reduce((acc, r) => acc + (r.starsCount || 0), 0);

  // Compute a real health score from actual telemetry
  const computedHealth = (() => {
    if (!repositories.length) return null;
    // PR health: fewer open PRs relative to repos is better
    const prRatio = pullRequests.length > 0 ? Math.max(0, 100 - pullRequests.length * 8) : 100;
    // Issue health: fewer open issues relative to repos is better
    const issueRatio = openIssuesCount > 0 ? Math.max(0, 100 - openIssuesCount * 4) : 100;
    // Combined weighted score
    return Math.round(prRatio * 0.5 + issueRatio * 0.5);
  })();

  return (
    <PageContainer
      title="Engineering Command Center"
      description="Live developer telemetry, pull request bottlenecks, velocity charts, and activity feeds."
      action={
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 transition-all"
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      }
    >
      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tracked Repos"
          value={repositories.length}
          subtitle={`${totalStars} total GitHub stars`}
          icon={FolderGit2}
          accentColor="emerald"
          trend={{ value: '+100%', isPositive: true }}
        />
        <MetricCard
          title="Open Pull Requests"
          value={pullRequests.length}
          subtitle="Awaiting review or merge"
          icon={GitPullRequest}
          accentColor="amber"
          trend={{ value: `${pullRequests.length} active`, isPositive: pullRequests.length < 5 }}
        />
        <MetricCard
          title="Open Issues"
          value={loading ? '—' : openIssuesCount}
          subtitle="Across all repositories"
          icon={AlertCircle}
          accentColor="rose"
        />
        <MetricCard
          title="Engineering Health"
          value={loading ? '—' : computedHealth !== null ? `${computedHealth}%` : 'Syncing...'}
          subtitle="Computed from PR & issue telemetry"
          icon={Activity}
          accentColor="emerald"
          trend={
            computedHealth !== null
              ? { value: computedHealth >= 80 ? 'Healthy' : 'Needs attention', isPositive: computedHealth >= 70 }
              : undefined
          }
        />
      </div>

      {/* 2. Middle Row: PR Bottlenecks & Velocity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <PRBottlenecks pullRequests={pullRequests} loading={loading} />
        </div>
        <div className="lg:col-span-6">
          <CommitVelocityChart />
        </div>
      </div>

      {/* 3. Bottom Row: CI/CD Pipeline Telemetry & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <DeploymentHealth />
        </div>
        <div className="lg:col-span-6">
          <ActivityFeed activities={activities} loading={loading} />
        </div>
      </div>
    </PageContainer>
  );
};
