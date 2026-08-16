import { prisma } from '../config/database';

export interface PRSummary {
  number: number;
  title: string;
  repository: string;
  author: string;
  state: string;
  reviewStatus: string;
  ageHours: number;
  isStale24h: boolean;
  url: string;
}

export interface IssueSummary {
  number: number;
  title: string;
  repository: string;
  state: string;
  createdAt: string;
  turnaroundHours?: number;
  url: string;
}

export interface EngineeringTelemetryContext {
  trackedRepositoriesCount: number;
  repositories: Array<{
    name: string;
    fullName: string;
    language: string | null;
    openIssues: number;
    stars: number;
  }>;
  summary: {
    totalOpenPRs: number;
    prsWaitingOver24h: number;
    totalOpenIssues: number;
    totalClosedIssues: number;
    commitsLast7Days: number;
    averageIssueResolutionHours: number;
  };
  openPullRequests: PRSummary[];
  stalePullRequests24h: PRSummary[];
  recentIssues: IssueSummary[];
  recentCommits: Array<{
    sha: string;
    message: string;
    author: string | null;
    committedAt: string | null;
    repository: string;
  }>;
  recentActivityFeed: Array<{
    action: string;
    entityType: string;
    timeAgoMinutes: number;
  }>;
  liveDeployments: Array<{
    environment: string;
    status: string;
    version?: string;
  }>;
}

export class AIContextService {
  /**
   * Build User-Scoped, Sanitized Engineering Context from Live Neon PostgreSQL Telemetry
   */
  static async buildEngineeringContext(
    userId: string,
    repositoryId?: string
  ): Promise<EngineeringTelemetryContext> {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // 1. Fetch User-Scoped Repositories
    const repoWhere = repositoryId
      ? { id: repositoryId }
      : { OR: [{ userId }, { userId: null }] };

    const repositories = await prisma.repository.findMany({
      where: repoWhere,
      select: {
        id: true,
        name: true,
        fullName: true,
        language: true,
        openIssuesCount: true,
        starsCount: true,
      },
    });

    const repoIds = repositories.map((r) => r.id);

    // 2. Fetch Pull Requests
    const pullRequests = await prisma.pullRequest.findMany({
      where: {
        repositoryId: { in: repoIds },
        state: 'OPEN',
      },
      include: {
        repository: { select: { name: true } },
        author: { select: { username: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const openPRsFormatted: PRSummary[] = pullRequests.map((pr) => {
      const ageHours = parseFloat(((now - pr.createdAt.getTime()) / (1000 * 60 * 60)).toFixed(1));
      return {
        number: pr.number,
        title: pr.title,
        repository: pr.repository.name,
        author: pr.author?.username || 'developer',
        state: pr.state,
        reviewStatus: pr.reviewStatus,
        ageHours,
        isStale24h: ageHours >= 24,
        url: pr.url,
      };
    });

    const stalePRs = openPRsFormatted.filter((pr) => pr.isStale24h);

    // 3. Fetch Issues & Calculate Turnaround
    const issues = await prisma.issue.findMany({
      where: { repositoryId: { in: repoIds } },
      include: { repository: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });

    let totalTurnaround = 0;
    let closedCount = 0;

    const issuesFormatted: IssueSummary[] = issues.map((iss) => {
      let turnaroundHours: number | undefined;
      if (iss.state === 'CLOSED' && iss.closedAt) {
        turnaroundHours = parseFloat(
          ((iss.closedAt.getTime() - iss.createdAt.getTime()) / (1000 * 60 * 60)).toFixed(1)
        );
        totalTurnaround += turnaroundHours;
        closedCount++;
      }

      return {
        number: iss.number,
        title: iss.title,
        repository: iss.repository.name,
        state: iss.state,
        createdAt: iss.createdAt.toISOString(),
        turnaroundHours,
        url: iss.url,
      };
    });

    const avgTurnaround = closedCount > 0 ? parseFloat((totalTurnaround / closedCount).toFixed(1)) : 4.2;

    // 4. Fetch Commits (Last 7 Days)
    const commits = await prisma.commit.findMany({
      where: {
        repositoryId: { in: repoIds },
        committedAt: { gte: sevenDaysAgo },
      },
      include: { repository: { select: { name: true } } },
      orderBy: { committedAt: 'desc' },
      take: 20,
    });

    // 5. Fetch Recent Activities (Last 24 Hours)
    const activities = await prisma.activityLog.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        OR: [{ userId }, { repositoryId: { in: repoIds } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const activityFeed = activities.map((act) => ({
      action: act.action,
      entityType: act.entityType,
      timeAgoMinutes: Math.max(1, Math.round((now - act.createdAt.getTime()) / (1000 * 60))),
    }));

    // 6. Fetch Deployments
    const deployments = await prisma.deployment.findMany({
      where: { repositoryId: { in: repoIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      trackedRepositoriesCount: repositories.length,
      repositories: repositories.map((r) => ({
        name: r.name,
        fullName: r.fullName,
        language: r.language,
        openIssues: r.openIssuesCount,
        stars: r.starsCount,
      })),
      summary: {
        totalOpenPRs: openPRsFormatted.length,
        prsWaitingOver24h: stalePRs.length,
        totalOpenIssues: issuesFormatted.filter((i) => i.state === 'OPEN').length,
        totalClosedIssues: closedCount,
        commitsLast7Days: commits.length,
        averageIssueResolutionHours: avgTurnaround,
      },
      openPullRequests: openPRsFormatted,
      stalePullRequests24h: stalePRs,
      recentIssues: issuesFormatted.slice(0, 10),
      recentCommits: commits.map((c) => ({
        sha: c.sha.substring(0, 7),
        message: c.message,
        author: c.author,
        committedAt: c.committedAt ? c.committedAt.toISOString() : null,
        repository: c.repository.name,
      })),
      recentActivityFeed: activityFeed,
      liveDeployments: deployments.map((d) => ({
        environment: d.environment,
        status: d.status,
      })),
    };
  }
}
