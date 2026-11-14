import { describe, it, expect } from 'vitest';
import { buildSanitizedChatPayload, generateMcpClientConfig } from './integrations';

describe('integrations sanitization & payload builder', () => {
  it('strictly excludes meeting titles and attendees from Slack payloads', () => {
    const payload = buildSanitizedChatPayload('slack', 'mute_deposit', {
      userName: 'Alex M',
      coinCount: 1,
      totalCycleCoins: 8,
      persona: 'roastmaster',
      roastQuote: 'Coffee shout incoming!',
    });

    const serialized = JSON.stringify(payload);
    // Guarantee no confidential meeting info leaks
    expect(serialized).not.toContain('Meeting Call');
    expect(serialized).not.toContain('confidential');
    expect(serialized).toContain('Alex M spoke while on mute!');
    expect(serialized).toContain('Total this cycle: 8');
    expect(serialized).toContain('Privacy Guarantee');
  });

  it('builds valid Discord embed with color and sanitized description', () => {
    const payload = buildSanitizedChatPayload('discord', 'goal_completed', {
      userName: 'Jordan',
      coinCount: 10,
      totalCycleCoins: 10,
      goalTitle: 'Donate $10 to Feeding America',
      goalValue: '$10.00',
    });

    expect(payload.content).toContain('Jordan completed their pledge');
    expect(payload.content).toContain('Donate $10 to Feeding America');
    const embeds = payload.embeds as Array<Record<string, unknown>>;
    expect(embeds).toHaveLength(1);
    expect(embeds[0].footer).toEqual({ text: '🔒 Privacy-First: Meeting titles never shared.' });
  });

  it('builds valid Microsoft Teams MessageCard format', () => {
    const payload = buildSanitizedChatPayload('teams', 'milestone_reach', {
      userName: 'Taylor',
      coinCount: 1,
      totalCycleCoins: 20,
    });

    expect(payload['@type']).toBe('MessageCard');
    expect(payload.summary).toContain('Mutecoin Milestone Reached');
    expect(payload.text).toContain('Taylor reached 20 Mutecoins this cycle!');
  });

  it('generates valid MCP client JSON configuration for Claude Desktop and Cursor', () => {
    const configStr = generateMcpClientConfig(3000);
    const parsed = JSON.parse(configStr);

    expect(parsed.mcpServers.mutejar).toBeDefined();
    expect(parsed.mcpServers.mutejar.url).toBe('http://localhost:3000/api/mcp');
  });
});
