import { prisma } from '../config/database';

export type DoraTier = 'ELITE' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DoraMetricItem {
  value: string;
  unit: string;
  tier: DoraTier;
  benchmark: string;
  description: string;
  historicalTrend: Array<{ date: string; value: number }>;
}

export interface DoraMetricsResult {
  overallTier: DoraTier;
  overallScore: number;
  deploymentFrequency: DoraMetricItem;
  leadTimeForChanges: DoraMetricItem;
  changeFailureRate: DoraMetricItem;
  meanTimeToRecovery: DoraMetricItem;
  recommendations: string[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Builds a 7-day trend array ordered oldest→newest.
 * Each item needs a `createdAt` Date. Optionally pass getValue to extract a numeric value.
 * If no value for a day, returns 0 (honest empty data).
 */
function buildWeeklyTrend(
  items: Array<{ createdAt: Date; [key: string]: any }>,
  getValue?: (item: any) => number
): Array<{ date: string; value: number }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Map: ISO-date-string → { total, count }
  const dayMap = new Map<string, { total: number; count: number }>();

  // Initialize last 7 calendar days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { total: 0, count: 0 });
  }

  for (const item of items) {
    if (item.createdAt >= sevenDaysAgo) {
      const key = item.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        const val = getValue ? getValue(item) : 1;
        entry.total += val;
        entry.count += 1;
      }
    }
  }

  // Return in chronological order
  return Array.from(dayMap.entries()).map(([dateStr, entry]) => {
    const d = new Date(dateStr);
    return {
      date: DAY_LABELS[d.getDay()],
      value: entry.count > 0 ? Number((entry.total / entry.count).toFixed(1)) : 0,
    };
  });
}

export class DoraService {
  /**
   * Calculate Real-Time DORA Metrics from Neon PostgreSQL
   */
  static async calculateMetrics(userId?: string): Promise<DoraMetricsResult> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Fetch Deployments in last 30 days
    const deployments = await prisma.deployment.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    const totalDeployments = deployments.length;
    const failedDeployments = deployments.filter((d) => d.status === 'FAILURE').length;

    // 1.1 Deployment Frequency (DF)
    const deploymentsPerWeek = Number(((totalDeployments / 30) * 7).toFixed(1));
    let dfTier: DoraTier = 'LOW';
    if (deploymentsPerWeek >= 7) dfTier = 'ELITE';
    else if (deploymentsPerWeek >= 1) dfTier = 'HIGH';
    else if (deploymentsPerWeek >= 0.5) dfTier = 'MEDIUM';

    // DF trend: count deployments per calendar day in last 7 days
    const dfTrend = buildWeeklyTrend(deployments);

    // 2. Fetch Merged PRs for Lead Time for Changes (LTTC)
    const mergedPRs = await prisma.pullRequest.findMany({
      where: { state: 'MERGED', mergedAt: { not: null } },
      orderBy: { mergedAt: 'asc' },
    });

    let avgLeadTimeHours = 0;
    if (mergedPRs.length > 0) {
      const totalHours = mergedPRs.reduce((acc, pr) => {
        return acc + (pr.mergedAt!.getTime() - pr.createdAt.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgLeadTimeHours = Number((totalHours / mergedPRs.length).toFixed(1));
    }

    let lttcTier: DoraTier = 'LOW';
    if (avgLeadTimeHours > 0 && avgLeadTimeHours <= 24) lttcTier = 'ELITE';
    else if (avgLeadTimeHours > 0 && avgLeadTimeHours <= 168) lttcTier = 'HIGH';
    else if (avgLeadTimeHours > 0) lttcTier = 'MEDIUM';

    // LTTC trend: avg lead-time hours per day (indexed by merge date)
    const lttcTrend = buildWeeklyTrend(
      mergedPRs
        .filter((pr) => pr.mergedAt !== null)
        .map((pr) => ({
          createdAt: pr.mergedAt!,
          leadTime: (pr.mergedAt!.getTime() - pr.createdAt.getTime()) / (1000 * 60 * 60),
        })),
      (item) => item.leadTime
    );

    // 3. Change Failure Rate (CFR)
    const failureRate =
      totalDeployments > 0
        ? Number(((failedDeployments / totalDeployments) * 100).toFixed(1))
        : 0;

    let cfrTier: DoraTier = 'ELITE';
    if (failureRate <= 5) cfrTier = 'ELITE';
    else if (failureRate <= 15) cfrTier = 'HIGH';
    else cfrTier = 'MEDIUM';

    // CFR trend: daily failure percentage
    const cfrTrend = buildWeeklyTrend(
      deployments.map((d) => ({
        createdAt: d.createdAt,
        isFailed: d.status === 'FAILURE' ? 1 : 0,
      })),
      (item) => item.isFailed * 100
    );

    // 4. Mean Time to Recovery (MTTR) from closed issues
    const closedIssues = await prisma.issue.findMany({
      where: { state: 'CLOSED', closedAt: { not: null } },
      orderBy: { closedAt: 'asc' },
    });

    let avgRecoveryHours = 0;
    if (closedIssues.length > 0) {
      const totalHours = closedIssues.reduce((acc, issue) => {
        return acc + (issue.closedAt!.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgRecoveryHours = Number((totalHours / closedIssues.length).toFixed(1));
    }

    let mttrTier: DoraTier = 'LOW';
    if (avgRecoveryHours > 0 && avgRecoveryHours <= 1) mttrTier = 'ELITE';
    else if (avgRecoveryHours > 0 && avgRecoveryHours <= 24) mttrTier = 'HIGH';
    else if (avgRecoveryHours > 0) mttrTier = 'MEDIUM';

    // MTTR trend: avg recovery hours per day (indexed by close date)
    const mttrTrend = buildWeeklyTrend(
      closedIssues
        .filter((i) => i.closedAt !== null)
        .map((i) => ({
          createdAt: i.closedAt!,
          recoveryHours: (i.closedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60),
        })),
      (item) => item.recoveryHours
    );

    // Overall Tier & Score — computed from actual tier values
    const tiers = [dfTier, lttcTier, cfrTier, mttrTier];
    const eliteCount = tiers.filter((t) => t === 'ELITE').length;
    const highCount = tiers.filter((t) => t === 'HIGH').length;
    const overallTier: DoraTier =
      eliteCount >= 3 ? 'ELITE' : eliteCount >= 2 ? 'HIGH' : highCount >= 2 ? 'MEDIUM' : 'LOW';

    const tierScore = (t: DoraTier) =>
      t === 'ELITE' ? 100 : t === 'HIGH' ? 75 : t === 'MEDIUM' ? 50 : 25;
    const overallScore = Math.round(
      (tierScore(dfTier) + tierScore(lttcTier) + tierScore(cfrTier) + tierScore(mttrTier)) / 4
    );

    // Dynamic recommendations — based on actual weakest metrics
    const recommendations: string[] = [];
    if (dfTier === 'ELITE') {
      recommendations.push('✅ Deployment frequency is ELITE — maintain CI/CD pipeline discipline.');
    } else {
      recommendations.push('🚀 Increase deployment frequency — aim for daily releases to reach ELITE tier.');
    }
    if (lttcTier !== 'ELITE') {
      recommendations.push('⚡ Reduce PR review lead time — target under 24 hours from commit to production.');
    }
    if (cfrTier !== 'ELITE') {
      recommendations.push('🛡️ Improve pre-merge testing coverage to reduce change failure rate below 5%.');
    }
    if (mttrTier !== 'ELITE') {
      recommendations.push('🔧 Set up automated rollback triggers to reduce mean time to recovery under 1 hour.');
    }
    if (recommendations.length === 1) {
      recommendations.push('📊 Continue maintaining current engineering velocity benchmarks across all four DORA metrics.');
    }

    return {
      overallTier,
      overallScore,
      deploymentFrequency: {
        value: `${deploymentsPerWeek}`,
        unit: 'deploys / week',
        tier: dfTier,
        benchmark: 'Elite: On-demand (Multiple deploys per day)',
        description: 'Measures how often code is deployed to production.',
        historicalTrend: dfTrend,
      },
      leadTimeForChanges: {
        value: avgLeadTimeHours > 0 ? `${avgLeadTimeHours}` : 'No data',
        unit: 'hours avg',
        tier: lttcTier,
        benchmark: 'Elite: Less than 1 day from commit to production',
        description: 'Time elapsed between first commit and successful production release.',
        historicalTrend: lttcTrend,
      },
      changeFailureRate: {
        value: `${failureRate}%`,
        unit: 'failure rate',
        tier: cfrTier,
        benchmark: 'Elite: 0% - 5% of deployments require remediation',
        description: 'Percentage of deployments causing service degradation in production.',
        historicalTrend: cfrTrend,
      },
      meanTimeToRecovery: {
        value: avgRecoveryHours > 0 ? `${avgRecoveryHours}` : 'No data',
        unit: 'hours avg',
        tier: mttrTier,
        benchmark: 'Elite: Under 1 hour to restore degraded production services',
        description: 'Time taken to restore service when an incident occurs.',
        historicalTrend: mttrTrend,
      },
      recommendations,
    };
  }
}
