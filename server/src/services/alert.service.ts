import axios from 'axios';
import { prisma } from '../config/database';
import { env } from '../config/env';

export interface WebhookAlertPayload {
  title: string;
  description: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'PR_BOTTLENECK' | 'SECURITY_ALERT' | 'DEPLOYMENT_FAILED' | 'TEST_NOTIFICATION';
  metadata?: Record<string, any>;
}

export class AlertService {
  /**
   * Send notification to configured Slack or Discord Webhooks
   */
  static async sendAlert(webhookUrl: string, payload: WebhookAlertPayload) {
    if (!webhookUrl || webhookUrl.trim() === '') {
      return { success: false, reason: 'No webhook URL provided' };
    }

    const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
    const isSlack = webhookUrl.includes('hooks.slack.com');

    try {
      if (isDiscord) {
        // Discord Embeds Format
        const color =
          payload.severity === 'CRITICAL'
            ? 15158332 // Red
            : payload.severity === 'WARNING'
            ? 15105570 // Orange
            : 3066993; // Green

        await axios.post(webhookUrl, {
          username: 'Developer Command Center Bot',
          avatar_url: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
          embeds: [
            {
              title: `[${payload.type}] ${payload.title}`,
              description: payload.description,
              color,
              timestamp: new Date().toISOString(),
              footer: { text: 'Developer Command Center • Telemetry Bot' },
              fields: payload.metadata
                ? Object.entries(payload.metadata).map(([key, val]) => ({
                    name: key,
                    value: String(val),
                    inline: true,
                  }))
                : [],
            },
          ],
        });
      } else {
        // Standard Slack / Generic JSON Webhook
        await axios.post(webhookUrl, {
          text: `🚨 *[${payload.type}] ${payload.title}*\n${payload.description}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `[${payload.type}] ${payload.title}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: payload.description,
              },
            },
          ],
        });
      }

      return { success: true, timestamp: new Date().toISOString() };
    } catch (err: any) {
      console.error('Failed to dispatch webhook alert:', err.message);
      return { success: false, error: err.message };
    }
  }
}
