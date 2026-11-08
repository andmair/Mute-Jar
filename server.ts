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
