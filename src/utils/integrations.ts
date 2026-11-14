import { ChatChannel, ChatPlatform, PublishableEventType } from '../types';
import { getLocalApiUrl } from './localSidecar';

export interface EventPayloadData {
  userName: string;
  coinCount: number;
  totalCycleCoins: number;
  goalTitle?: string;
  goalValue?: string;
  persona?: string;
  roastQuote?: string;
}

/**
 * Builds platform-specific, strictly sanitized chat payloads for Slack, Discord, and Microsoft Teams.
 * Absolute Privacy Guarantee: Meeting titles, calendar notes, participant names, and audio streams
 * are NEVER included in any outbound message payload.
 */
export function buildSanitizedChatPayload(
  platform: ChatPlatform,
  eventType: PublishableEventType,
  data: EventPayloadData
): Record<string, unknown> {
  const { userName, coinCount, totalCycleCoins, goalTitle, goalValue, roastQuote } = data;
  const userDisplay = userName || 'A team member';

  let title = 'Mute Jar Update';
  let bodyText = '';
  let colorHex = '#F59E0B'; // Amber default

  switch (eventType) {
    case 'mute_deposit':
      title = '🪙 Mute Jar Deposit';
      bodyText = `${userDisplay} spoke while on mute! Added ${coinCount} Mutecoin to the jar. Total this cycle: ${totalCycleCoins}.`;
      colorHex = '#EF4444'; // Red-orange
      break;

    case 'milestone_reach':
      title = '🎯 Mutecoin Milestone Reached';
      bodyText = `Milestone alert! ${userDisplay} reached ${totalCycleCoins} Mutecoins this cycle!`;
      colorHex = '#F59E0B'; // Amber
      break;

    case 'goal_completed':
      title = '🏆 Pledge Goal Completed';
      bodyText = `Hooray! ${userDisplay} completed their pledge: "${goalTitle || 'Goal'}" (${goalValue || `${totalCycleCoins} Mutecoins fulfilled`}).`;
      colorHex = '#10B981'; // Emerald
      break;

    case 'cycle_summary':
      title = '📊 Monthly Mute Jar Recap';
      bodyText = `Monthly cycle concluded. ${userDisplay} collected ${totalCycleCoins} Mutecoins across this cycle. Turning slip-ups into team accountability!`;
      colorHex = '#6366F1'; // Indigo
      break;
  }

  if (roastQuote) {
    bodyText += `\n> "${roastQuote}"`;
  }

  // Format per platform
  if (platform === 'slack') {
    return {
      text: `${title}: ${bodyText}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: bodyText,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🔒 *Privacy Guarantee*: Meeting titles & audio are kept 100% local on device.',
            },
          ],
        },
      ],
    };
  }

  if (platform === 'discord') {
    // Discord embed
    const decimalColor = parseInt(colorHex.replace('#', ''), 16) || 0xf59e0b;
    return {
      content: `**${title}**\n${bodyText}`,
      embeds: [
        {
          title,
          description: bodyText,
          color: decimalColor,
          footer: {
            text: '🔒 Privacy-First: Meeting titles never shared.',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // Microsoft Teams MessageCard format
  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: colorHex.replace('#', ''),
    summary: title,
    title,
    text: bodyText,
    sections: [
      {
        facts: [
          { name: 'Member', value: userDisplay },
          { name: 'Total Coins', value: `${totalCycleCoins} Mutecoins` },
          { name: 'Privacy Mode', value: 'Strict On-Device Only' },
        ],
      },
    ],
  };
}

/**
 * Dispatches a webhook notification directly from client, falling back to local server relay
 * if browser CORS restrictions block direct client-side POST to external webhook domain.
 */
export async function sendWebhookNotification(
  channel: ChatChannel,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Attempt direct dispatch
    const res = await fetch(channel.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors',
    }).catch(async (directError) => {
      // If direct fetch is blocked by browser CORS, route through local sidecar relay
      console.warn('Direct webhook fetch blocked by CORS, trying local relay:', directError);
      return await fetch(getLocalApiUrl('/api/integrations/relay-webhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: channel.webhookUrl,
          payload,
        }),
      });
    });

    if (!res.ok && res.status !== 200 && res.status !== 204) {
      const errText = await res.text().catch(() => 'Status ' + res.status);
      return { success: false, error: `Webhook responded with ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Generates ready-to-copy Claude Desktop or Cursor configuration for the local Model Context Protocol (MCP) server.
 */
export function generateMcpClientConfig(serverPort = 3000): string {
  const config = {
    mcpServers: {
      mutejar: {
        url: `http://localhost:${serverPort}/api/mcp`,
        description: 'Mute Jar local meeting habit statistics and pledge tracker',
      },
    },
  };
  return JSON.stringify(config, null, 2);
}
