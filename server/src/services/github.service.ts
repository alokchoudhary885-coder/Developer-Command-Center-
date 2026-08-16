import axiosClient from 'axios';
import { env } from '../config/env';

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  owner: {
    login: string;
  };
}

export interface GitHubPRResponse {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft?: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GitHubIssueResponse {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: any;
  assignee?: {
    id: number;
    login: string;
  };
}

export interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
}

export class GitHubService {
  private static GITHUB_API_BASE = 'https://api.github.com';
  private static GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
  private static GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

  static getAuthorizationUrl(state: string): string {
    const clientId = env.GITHUB_CLIENT_ID || 'mock_client_id';
    const redirectUri = env.GITHUB_CALLBACK_URL;
    const scope = 'read:user user:email repo';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    });

    return `${this.GITHUB_OAUTH_URL}?${params.toString()}`;
  }

  static async exchangeCodeForToken(code: string): Promise<string> {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new Error('GitHub OAuth credentials not configured in .env');
    }

    const response = await axiosClient.post(
      this.GITHUB_TOKEN_URL,
      {
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || response.data.error);
    }

    return response.data.access_token;
  }

  static async fetchUserProfile(accessToken: string): Promise<GitHubUserProfile> {
    if (accessToken.startsWith('mock_')) {
      return {
        id: 88776655,
        login: 'alok-engineer',
        name: 'Alok Engineer',
        email: 'alok.engineer@commandcenter.dev',
        avatar_url: 'https://avatars.githubusercontent.com/u/88776655?v=4',
      };
    }

    const response = await axiosClient.get<GitHubUserProfile>(`${this.GITHUB_API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.data;
  }

  private static checkRateLimit(headers: any) {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (remaining !== undefined && parseInt(remaining, 10) <= 1) {
      const resetDate = reset ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString() : 'shortly';
      console.warn(`⚠️ [GitHub API] Rate limit nearly exhausted! Resets at: ${resetDate}`);
    }
  }

  /**
   * Fetch all user repositories with automatic multi-page pagination or dev telemetry
   */
  static async fetchAllUserRepositories(accessToken: string): Promise<GitHubRepoResponse[]> {
    if (accessToken.startsWith('mock_')) {
      return [
        {
          id: 9000101,
          name: 'Developer-Command-Center',
          full_name: 'dev-org/Developer-Command-Center',
          description: 'Production Engineering Productivity Platform with WebSockets & Gemini AI',
          private: false,
          default_branch: 'main',
          html_url: 'https://github.com/dev-org/Developer-Command-Center',
          language: 'TypeScript',
          stargazers_count: 142,
          forks_count: 38,
          open_issues_count: 4,
          owner: { login: 'dev-org' },
        },
        {
          id: 9000102,
          name: 'telemetry-engine',
          full_name: 'dev-org/telemetry-engine',
          description: 'High-throughput real-time metrics and event stream ingest pipeline',
          private: true,
          default_branch: 'main',
          html_url: 'https://github.com/dev-org/telemetry-engine',
          language: 'TypeScript',
          stargazers_count: 89,
          forks_count: 12,
          open_issues_count: 2,
          owner: { login: 'dev-org' },
        },
        {
          id: 9000103,
          name: 'cloud-orchestrator',
          full_name: 'dev-org/cloud-orchestrator',
          description: 'Automated container deployments and Kubernetes cluster state manager',
          private: false,
          default_branch: 'main',
          html_url: 'https://github.com/dev-org/cloud-orchestrator',
          language: 'Go',
          stargazers_count: 310,
          forks_count: 64,
          open_issues_count: 5,
          owner: { login: 'dev-org' },
        },
      ];
    }

    const allRepos: GitHubRepoResponse[] = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 10;

    while (page <= maxPages) {
      try {
        const response = await axiosClient.get<GitHubRepoResponse[]>(
          `${this.GITHUB_API_BASE}/user/repos`,
          {
            params: {
              sort: 'updated',
              per_page: perPage,
              page,
              affiliation: 'owner,collaborator,organization_member',
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        this.checkRateLimit(response.headers);
        const data = response.data;
        if (!data || data.length === 0) break;

        allRepos.push(...data);
        if (data.length < perPage) break;
        page++;
      } catch (error: any) {
        if (error.response?.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
          throw new Error('GitHub API rate limit exceeded. Please wait a few minutes before retrying.');
        }
        throw error;
      }
    }

    return allRepos;
  }

  /**
   * Fetch pull requests for a repository
   */
  static async fetchRepositoryPullRequests(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubPRResponse[]> {
    if (accessToken.startsWith('mock_')) {
      const now = Date.now();
      return [
        {
          id: 99142,
          number: 142,
          title: 'feat(security): implement HMAC SHA-256 Webhook pipeline',
          body: 'Decoupled Socket.IO broadcast architecture with timingSafeEqual security.',
          state: 'open',
          html_url: `https://github.com/${owner}/${repo}/pull/142`,
          created_at: new Date(now - 28 * 60 * 60 * 1000).toISOString(), // 28 hours ago (Stale Bottleneck)
          updated_at: new Date().toISOString(),
          closed_at: null,
          merged_at: null,
          user: { id: 88776655, login: 'alok-engineer', avatar_url: 'https://avatars.githubusercontent.com/u/88776655?v=4' },
        },
        {
          id: 99145,
          number: 145,
          title: 'feat: delivery ID deduplication safeguard',
          body: 'Guarantees delivery-level idempotency and replay protection.',
          state: 'open',
          html_url: `https://github.com/${owner}/${repo}/pull/145`,
          created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          closed_at: null,
          merged_at: null,
          user: { id: 88776655, login: 'alok-engineer', avatar_url: 'https://avatars.githubusercontent.com/u/88776655?v=4' },
        },
        {
          id: 99130,
          number: 130,
          title: 'fix(crypto): migrate from AES-256-CBC to AES-256-GCM',
          body: 'Added authentication tag verification for token security.',
          state: 'closed',
          html_url: `https://github.com/${owner}/${repo}/pull/130`,
          created_at: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          closed_at: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
          user: { id: 88776655, login: 'alok-engineer', avatar_url: 'https://avatars.githubusercontent.com/u/88776655?v=4' },
        },
      ];
    }

    const allPRs: GitHubPRResponse[] = [];
    let page = 1;
    const perPage = 100;

    while (page <= 5) {
      const response = await axiosClient.get<GitHubPRResponse[]>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`,
        {
          params: {
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
            page,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      this.checkRateLimit(response.headers);
      const data = response.data;
      if (!data || data.length === 0) break;

      allPRs.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return allPRs;
  }

  /**
   * Fetch issues for a repository
   */
  static async fetchRepositoryIssues(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubIssueResponse[]> {
    if (accessToken.startsWith('mock_')) {
      const now = Date.now();
      return [
        {
          id: 99201,
          number: 201,
          title: 'Fix timing safe signature comparison',
          body: 'Verify crypto.timingSafeEqual comparison for webhooks',
          state: 'closed',
          html_url: `https://github.com/${owner}/${repo}/issues/201`,
          created_at: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          closed_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 99202,
          number: 202,
          title: 'Add support for team-level RBAC role hierarchies',
          body: 'Implement TECH_LEAD and ENGINEERING_MANAGER role scopes',
          state: 'open',
          html_url: `https://github.com/${owner}/${repo}/issues/202`,
          created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          closed_at: null,
        },
      ];
    }

    const allIssues: GitHubIssueResponse[] = [];
    let page = 1;
    const perPage = 100;

    while (page <= 5) {
      const response = await axiosClient.get<GitHubIssueResponse[]>(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/issues`,
        {
          params: {
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
            page,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      this.checkRateLimit(response.headers);
      const data = response.data;
      if (!data || data.length === 0) break;

      const issuesOnly = data.filter((item) => !item.pull_request);
      allIssues.push(...issuesOnly);

      if (data.length < perPage) break;
      page++;
    }

    return allIssues;
  }

  /**
   * Fetch commits for a repository
   */
  static async fetchRepositoryCommits(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubCommitResponse[]> {
    if (accessToken.startsWith('mock_')) {
      const now = Date.now();
      return [
        {
          sha: '7f9c2d1e4a3b8c5d6e7f8a9b0c1d2e3f4a5b6c7d',
          html_url: `https://github.com/${owner}/${repo}/commit/7f9c2d1`,
          commit: {
            message: 'feat: real-time Socket.IO activity streaming and telemetry',
            author: { name: 'Alok', date: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
          },
          author: { login: 'alok-engineer', avatar_url: 'https://avatars.githubusercontent.com/u/88776655?v=4' },
        },
        {
          sha: 'a1b2c3d4e5f67890123456789abcdef012345678',
          html_url: `https://github.com/${owner}/${repo}/commit/a1b2c3d`,
          commit: {
            message: 'feat(security): AES-256-GCM token storage & timingSafeEqual',
            author: { name: 'Alok', date: new Date(now - 14 * 60 * 60 * 1000).toISOString() },
          },
          author: { login: 'alok-engineer', avatar_url: 'https://avatars.githubusercontent.com/u/88776655?v=4' },
        },
      ];
    }

    const response = await axiosClient.get<GitHubCommitResponse[]>(
      `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/commits`,
      {
        params: {
          per_page: 30,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    this.checkRateLimit(response.headers);
    return response.data || [];
  }
}
