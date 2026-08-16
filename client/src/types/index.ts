export type Role = 'DEVELOPER' | 'TECH_LEAD' | 'ENGINEERING_MANAGER' | 'ADMIN';
export type AuthProviderType = 'LOCAL' | 'GOOGLE' | 'GITHUB';
export type PRState = 'OPEN' | 'CLOSED' | 'MERGED';
export type PRReviewStatus = 'APPROVED' | 'CHANGES_REQUESTED' | 'PENDING_REVIEW' | 'DRAFT';
export type IssueState = 'OPEN' | 'CLOSED';
export type DeploymentStatus = 'PENDING' | 'QUEUED' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';
export type ReviewVerdict = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENT';

export interface User {
  id: string;
  githubId?: string | null;
  googleId?: string | null;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: Role;
  authProvider?: AuthProviderType;
  createdAt: string;
}

export interface Repository {
  id: string;
  githubId: string;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
  htmlUrl: string;
  language: string | null;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  userId?: string | null;
  _count?: {
    pullRequests: number;
    issues: number;
    commits: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAlert {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  file?: string;
  line?: number;
}

export interface PerformanceNote {
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

export interface PrReview {
  id: string;
  pullRequestId: string;
  score: number;
  verdict: ReviewVerdict;
  summary: string;
  securityAlerts?: SecurityAlert[];
  performanceNotes?: PerformanceNote[];
  codeSmells?: string[];
  rawDiff?: string | null;
  createdAt: string;
}

export interface PullRequest {
  id: string;
  githubId: string;
  number: number;
  title: string;
  description: string | null;
  url: string;
  state: PRState;
  reviewStatus: PRReviewStatus;
  repositoryId: string;
  authorId?: string | null;
  repository?: {
    name: string;
    fullName?: string;
  };
  author?: {
    username: string;
    avatarUrl?: string;
  } | null;
  reviews?: PrReview[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
}

export interface Issue {
  id: string;
  githubId: string;
  number: number;
  title: string;
  description: string | null;
  url: string;
  state: IssueState;
  repositoryId: string;
  assigneeId?: string | null;
  repository?: {
    name: string;
  };
  assignee?: {
    username: string;
    avatarUrl?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Commit {
  id: string;
  sha: string;
  message: string;
  author: string | null;
  authorAvatar: string | null;
  url: string | null;
  committedAt: string | null;
  repositoryId: string;
  repository?: {
    name: string;
  };
}

export interface Deployment {
  id: string;
  externalId?: string | null;
  environment: string;
  status: DeploymentStatus;
  commitSha?: string | null;
  url?: string | null;
  repositoryId: string;
  triggeredById?: string | null;
  repository?: {
    name: string;
    fullName?: string;
  };
  triggeredBy?: {
    username: string;
    avatarUrl?: string;
  } | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
  userId?: string | null;
  repositoryId?: string | null;
  createdAt: string;
  user?: {
    username: string;
    avatarUrl?: string;
  } | null;
  repository?: {
    name: string;
    fullName: string;
  } | null;
}

export interface EngineeringMetrics {
  summary: {
    openPRs: number;
    mergedPRsThisWeek: number;
    openIssues: number;
    closedIssuesThisWeek: number;
    liveDeployments: number;
    avgReviewTimeHours: number;
    deploymentSuccessRate: string;
  };
  weeklyVelocity: Array<{
    day: string;
    prsMerged: number;
    issuesClosed: number;
    commits: number;
    deployments: number;
  }>;
  teamActivity: Array<{
    name: string;
    prs: number;
    reviews: number;
    commits: number;
    impactScore: number;
  }>;
}
