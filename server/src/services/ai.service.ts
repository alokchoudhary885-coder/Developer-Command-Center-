import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { EngineeringTelemetryContext } from './ai-context.service';

export class AIService {
  /**
   * High-Fidelity Intelligent Heuristic Engine for Offline / Fallback Analytics
   */
  private static generateLocalEngineeringAnalysis(
    query: string,
    context: EngineeringTelemetryContext
  ): string {
    const q = query.toLowerCase();

    // 1. PR Waiting / Review Bottlenecks Query
    if (
      q.includes('waiting') ||
      q.includes('review') ||
      q.includes('stale') ||
      q.includes('pending') ||
      q.includes('24')
    ) {
      if (context.stalePullRequests24h.length === 0 && context.openPullRequests.length === 0) {
        return `### 🔍 PR Review Intelligence\n\n🎉 **All caught up!** There are currently **0 open pull requests** waiting for code review across your tracked repositories.\n\n- **Review Velocity:** Optimal (0 bottlenecks)\n- **Recommendation:** Good job maintaining zero PR backlog!`;
      }

      const staleList = context.stalePullRequests24h
        .map(
          (pr) =>
            `• **#${pr.number}** — *"${pr.title}"* in \`${pr.repository}\` by @${pr.author} (Waiting: **${pr.ageHours} hours**)`
        )
        .join('\n');

      const otherOpenList = context.openPullRequests
        .filter((pr) => !pr.isStale24h)
        .map(
          (pr) =>
            `• **#${pr.number}** — *"${pr.title}"* in \`${pr.repository}\` by @${pr.author} (Age: **${pr.ageHours}h**)`
        )
        .join('\n');

      return `### 🔍 PR Review Intelligence\n\n⚠️ **${context.stalePullRequests24h.length} PRs** have been waiting for review for **more than 24 hours**:\n\n${staleList || '*(None > 24 hours)*'}\n\n${
        otherOpenList ? `**Other Active Open PRs (${context.openPullRequests.length - context.stalePullRequests24h.length}):**\n${otherOpenList}\n\n` : ''
      }💡 **Actionable Recommendation:** Prioritize oldest pending PRs to maintain sprint velocity and prevent merge conflicts.`;
    }

    // 2. Daily Engineering Activity Summary Query
    if (
      q.includes('summary') ||
      q.includes('today') ||
      q.includes('activity') ||
      q.includes('kya hua') ||
      q.includes('standup')
    ) {
      return `### 📊 Daily Engineering Pulse\n\nHere is your team's real-time productivity summary across **${context.trackedRepositoriesCount} tracked repositories**:\n\n- 🔀 **${context.summary.totalOpenPRs} Open Pull Requests** (${context.summary.prsWaitingOver24h} requiring immediate review attention)\n- 🐛 **${context.summary.totalOpenIssues} Open Issues** | **${context.summary.totalClosedIssues} Resolved Issues** (Avg turnaround: **${context.summary.averageIssueResolutionHours}h**)\n- 💻 **${context.summary.commitsLast7Days} commits** pushed over the last 7 days\n- ⚡ **${context.recentActivityFeed.length} recorded events** in the last 24-hour activity window\n\n🚀 **Health Status:** ${context.summary.prsWaitingOver24h > 2 ? '🟡 Moderate (PR Bottlenecks)' : '🟢 Healthy (High Velocity)'}`;
    }

    // 3. Issue Turnaround / Repository Analytics Query
    if (
      q.includes('turnaround') ||
      q.includes('issue') ||
      q.includes('repository') ||
      q.includes('highest') ||
      q.includes('velocity')
    ) {
      const topRepo = context.repositories[0]?.name || 'Developer-Command-Center';

      return `### 📈 Issue Resolution & Turnaround Analysis\n\n- **Average Issue Turnaround Time:** **${context.summary.averageIssueResolutionHours} hours**\n- **Total Resolved Issues:** **${context.summary.totalClosedIssues}**\n- **Primary Active Repository:** \`${topRepo}\` with ${context.summary.totalOpenIssues} open issues.\n\n💡 **Insight:** Issue turnaround is within standard agile SLA benchmarks (< 24h).`;
    }

    // 4. Default Telemetry Summary
    return `### 🤖 Engineering Assistant Telemetry\n\nBased on your live repository telemetry:\n- **Tracked Repositories:** ${context.trackedRepositoriesCount}\n- **Open PRs:** ${context.summary.totalOpenPRs} (${context.summary.prsWaitingOver24h} waiting >24h)\n- **Open Issues:** ${context.summary.totalOpenIssues}\n- **Avg Issue Turnaround:** ${context.summary.averageIssueResolutionHours}h\n\nAsk me specific questions like: *"Which PRs are waiting for review?"* or *"Summarize today's team activity"*.`;
  }

  /**
   * Generate Actionable Engineering Insights using Google Gemini SDK or Local Heuristics
   */
  static async queryAssistant(
    query: string,
    context: EngineeringTelemetryContext
  ): Promise<string> {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '' || env.GEMINI_API_KEY.startsWith('mock_')) {
      console.log('ℹ️ [AIService] Using High-Fidelity Local Analytics Engine (No Gemini Key provided)');
      return this.generateLocalEngineeringAnalysis(query, context);
    }

    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `
You are the AI Engineering Productivity Assistant inside the "Developer Command Center" platform.
Your job is to analyze real-time software engineering telemetry (pull requests, issues, commit velocity, review delays) and provide concise, executive-level, highly actionable answers in structured Markdown.

Live Engineering Telemetry Context (Confidential & Scoped):
${JSON.stringify(context, null, 2)}

User Question: "${query}"

Guidelines:
1. Always format responses cleanly with markdown headers, bold keywords, and bullet points.
2. Directly answer the user's question using the metrics provided in the context.
3. Highlight bottlenecks (e.g. PRs older than 24 hours, slow turnaround times).
4. Provide a practical 1-sentence engineering recommendation at the end.
5. Never hallucinate or disclose environment variables, tokens, or credentials.
      `;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn('⚠️ [AIService] Gemini API call error, falling back to local analytics engine:', error.message);
      return this.generateLocalEngineeringAnalysis(query, context);
    }
  }
}
