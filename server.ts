import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Allow standalone Tauri desktop bundles to connect to the optional local sidecar on port 3000
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin === 'tauri://localhost' ||
    origin === 'http://tauri.localhost' ||
    origin === 'https://tauri.localhost' ||
    origin === 'http://localhost:3000'
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint to generate creative pledges and goals using Gemini
app.post('/api/pledges/suggest', async (req, res) => {
  try {
    const { persona = 'pragmatist', coinCount = 12, category = 'all' } = req.body;

    if (!ai) {
      // Fallback suggestions if API key is not yet configured
      return res.json({
        suggestions: getFallbackSuggestions(persona, coinCount, category),
      });
    }

    const personaPrompts: Record<string, string> = {
      saint: 'The Saint persona focuses on altruism, charity giving, kindness, and making a positive community impact.',
      pragmatist: 'The Pragmatist persona focuses on personal growth, health, physical fitness, books, and productivity habits.',
      roastmaster: 'The Roast Master persona focuses on humor, playful office penalties, team coffee shouts, fun dares, and funny roasts.',
    };

    const targetPersonaDesc = personaPrompts[persona] || personaPrompts.pragmatist;

    const prompt = `Generate 4 creative, specific, and actionable pledge and goal ideas for a user of a "Mute Jar" app.
The user talked while on mute in meetings ${coinCount} times this past month.
User Persona: ${persona} (${targetPersonaDesc}).
Requested Category: ${category} (can be 'work', 'personal', 'charity', or 'all').

Requirements:
- Make each suggestion directly scale with or relate to their ${coinCount} mute coins (e.g. "${coinCount * 2} pushups", "Donate $${coinCount} to a local food bank", "Bring ${Math.max(4, Math.min(24, coinCount))} artisan pastries to team retro", "Read ${coinCount * 5} pages of a leadership book").
- Tone should match their chosen persona: witty & fun for roastmaster, disciplined & constructive for pragmatist, thoughtful & benevolent for saint.
- Return structured suggestions with: title, description, category ('work' | 'personal' | 'charity'), and actionMetric (e.g., "${coinCount} reps", "$${coinCount} donation", "1 team shout").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  actionMetric: { type: Type.STRING },
                },
                required: ['title', 'description', 'category', 'actionMetric'],
              },
            },
          },
          required: ['suggestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text ?? '{"suggestions":[]}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    // Return high quality fallback suggestions on error
    const { persona = 'pragmatist', coinCount = 10, category = 'all' } = req.body || {};
    return res.json({
      suggestions: getFallbackSuggestions(persona, coinCount, category),
    });
  }
});

function getFallbackSuggestions(persona: string, count: number, category: string) {
  const all = [
    {
      title: 'Charity Micro-Donation',
      description: `Donate $${Math.max(5, count)} to a verified global cause on GlobalGiving or Every.org.`,
      category: 'charity',
      actionMetric: `$${Math.max(5, count)} Donation`,
    },
    {
      title: 'Team Coffee & Donut Shout',
      description: `Treat your closest meeting colleagues to morning coffees or pastries for tolerating your mute-speaks.`,
      category: 'work',
      actionMetric: `${count} Coffees / Pastries`,
    },
    {
      title: 'Deep Focus Pushup Blitz',
      description: `Knock out ${count * 5} pushups spread across your post-meeting standups this week.`,
      category: 'personal',
      actionMetric: `${count * 5} Pushups`,
    },
    {
      title: 'Lightning Knowledge Share',
      description: `Prepare and deliver a 5-minute lightning talk on your favorite productivity hack at next team sync.`,
      category: 'work',
      actionMetric: '1 Lightning Presentation',
    },
  ];

  if (category && category !== 'all') {
    return all.filter((s) => s.category === category);
  }
  return all;
}

// -------------------------------------------------------------
// Local Model Context Protocol (MCP) Server State & Endpoints
// Exposes read-only local resources & tools for Claude Desktop / Cursor
// -------------------------------------------------------------
const mcpLocalState = {
  stats: {
    totalCycleCoins: 0,
    totalMeetings: 0,
    persona: 'pragmatist',
    streakDays: 3,
    lastMuteAt: Date.now(),
  },
  events: [] as Array<{
    timestamp: number;
    coinCount: number;
    durationSeconds: number;
    detectedMethod: string;
  }>,
  pledges: [] as Array<{
    title: string;
    description: string;
    status: string;
    type: string;
    coinsCommitted: number;
    actionMetric: string;
  }>,
};

// Client syncs non-sensitive state into local MCP server RAM
app.post('/api/mcp/sync-state', (req, res) => {
  const { stats, events, pledges } = req.body || {};
  if (stats) {
    mcpLocalState.stats = {
      totalCycleCoins: Number(stats.totalCycleCoins) || 0,
      totalMeetings: Number(stats.totalMeetings) || 0,
      persona: String(stats.persona || 'pragmatist'),
      streakDays: Number(stats.streakDays) || 0,
      lastMuteAt: stats.lastMuteAt || Date.now(),
    };
  }
  if (Array.isArray(events)) {
    // Strictly omit any meeting titles or private data
    mcpLocalState.events = events.slice(0, 50).map((e: any) => ({
      timestamp: Number(e.timestamp) || Date.now(),
      coinCount: 1,
      durationSeconds: Number(e.durationSeconds) || 0,
      detectedMethod: String(e.detectedMethod || 'auto_audio'),
    }));
  }
  if (Array.isArray(pledges)) {
    mcpLocalState.pledges = pledges.slice(0, 30).map((p: any) => ({
      title: String(p.title || ''),
      description: String(p.description || ''),
      status: String(p.status || 'pending'),
      type: String(p.type || 'pledge'),
      coinsCommitted: Number(p.coinsCommitted) || 0,
      actionMetric: String(p.estimatedValue || p.actionMetric || ''),
    }));
  }
  res.json({ ok: true, syncedAt: Date.now() });
});

// MCP Server Information & Exploration
app.get('/api/mcp', (_req, res) => {
  res.json({
    name: 'mutejar-local-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    status: 'running',
    description: 'Local Model Context Protocol (MCP) data server for Mute Jar habit logs and goals',
    capabilities: {
      resources: ['mutejar://stats', 'mutejar://events', 'mutejar://pledges'],
      tools: ['get_mute_stats', 'list_pledges', 'suggest_pledge_action'],
    },
    privacy: 'Strict On-Device Only. Meeting titles and audio streams are never stored or exposed.',
  });
});

// MCP JSON-RPC 2.0 Handler
app.post('/api/mcp', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
    });
  }

  switch (method) {
    case 'initialize':
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'mutejar-local-mcp',
            version: '1.0.0',
          },
          capabilities: {
            resources: {},
            tools: {},
          },
        },
      });

    case 'notifications/initialized':
      return res.status(204).end();

    case 'resources/list':
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          resources: [
            {
              uri: 'mutejar://stats',
              name: 'Mute Jar Cycle Statistics',
              description: 'Aggregated Mutecoin counts, streak, and persona configuration for the current cycle',
              mimeType: 'application/json',
            },
            {
              uri: 'mutejar://events',
              name: 'Sanitized Mute Incident Log',
              description: 'Recent mute events with timestamps and duration (meeting titles strictly redacted)',
              mimeType: 'application/json',
            },
            {
              uri: 'mutejar://pledges',
              name: 'Pledges & Goals',
              description: 'Active and completed charitable, personal, and team pledges',
              mimeType: 'application/json',
            },
          ],
        },
      });

    case 'resources/read': {
      const uri = params?.uri;
      if (uri === 'mutejar://stats') {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(mcpLocalState.stats, null, 2),
              },
            ],
          },
        });
      }
      if (uri === 'mutejar://events') {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(mcpLocalState.events, null, 2),
              },
            ],
          },
        });
      }
      if (uri === 'mutejar://pledges') {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(mcpLocalState.pledges, null, 2),
              },
            ],
          },
        });
      }
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Resource not found: ${uri}` },
      });
    }

    case 'tools/list':
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'get_mute_stats',
              description: 'Get current cycle Mutecoin tallies, meeting totals, and habit streak',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'list_pledges',
              description: 'List active and completed pledges, charity donations, or fitness goals',
              inputSchema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['all', 'pending', 'completed'],
                    description: 'Filter pledges by status',
                  },
                },
              },
            },
            {
              name: 'suggest_pledge_action',
              description: 'Generate creative, constructive pledge ideas based on Mutecoin totals',
              inputSchema: {
                type: 'object',
                properties: {
                  persona: {
                    type: 'string',
                    enum: ['saint', 'pragmatist', 'roastmaster'],
                  },
                  coinCount: {
                    type: 'number',
                  },
                },
                required: ['coinCount'],
              },
            },
          ],
        },
      });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      if (toolName === 'get_mute_stats') {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mcpLocalState.stats, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'list_pledges') {
        const filter = toolArgs.status || 'all';
        const filtered =
          filter === 'all'
            ? mcpLocalState.pledges
            : mcpLocalState.pledges.filter((p) => p.status === filter);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(filtered, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'suggest_pledge_action') {
        const persona = toolArgs.persona || mcpLocalState.stats.persona;
        const count = toolArgs.coinCount || mcpLocalState.stats.totalCycleCoins || 5;
        const suggestions = getFallbackSuggestions(persona, count, 'all');
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(suggestions, null, 2),
              },
            ],
          },
        });
      }

      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      });
    }

    default:
      return res.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
  }
});

// Webhook Relay fallback for browsers enforcing strict CORS on external webhooks
app.post('/api/integrations/relay-webhook', async (req, res) => {
  const { webhookUrl, payload } = req.body || {};
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid webhookUrl' });
  }

  try {
    const parsed = new URL(webhookUrl);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // Forward outbound webhook from server
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text().catch(() => '');
    if (!response.ok && response.status !== 200 && response.status !== 204) {
      return res.status(response.status).json({
        error: `Webhook returned status ${response.status}: ${text}`,
      });
    }

    return res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// Dev vs Production server handling
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mute Jar server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
