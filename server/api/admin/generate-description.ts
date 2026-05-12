import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_utils/cors.js';
import { requireAdmin } from '../_utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireAdmin(req);

    const { title, category, imageUrl } = req.body as {
      title?: string;
      category?: string;
      imageUrl?: string;
    };

    if (!title || !category) {
      return res.status(400).json({ error: 'title and category are required' });
    }
    if (title.length > 200 || category.length > 100) {
      return res.status(400).json({ error: 'Input too long' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI service not configured. Set GROQ_API_KEY.' });
    }

    const imageContext = imageUrl && imageUrl.startsWith('http')
      ? `\nAn event image is available at: ${imageUrl} — use it as visual context for the description.`
      : '';

    const userPrompt = `Generate a professional event description for the following event:

Event Title: ${title}
Category: ${category}${imageContext}

Requirements:
- 120–150 words
- Engaging and modern marketing tone
- Audience-focused and action-oriented
- SEO-friendly language
- Plain text only — no markdown, no bullet points
- Do NOT open with the event title as the first sentence
- End with a subtle call-to-action encouraging attendance

Write the description now:`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let groqRes: Response;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a professional event copywriter. Write concise, engaging, and SEO-friendly event descriptions.',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 350,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({})) as any;
      throw new Error(errData?.error?.message || `Groq API error (${groqRes.status})`);
    }

    const data = await groqRes.json() as any;
    const description = data?.choices?.[0]?.message?.content?.trim();

    if (!description) {
      throw new Error('No description returned by AI');
    }

    return res.status(200).json({ description });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate description';
    console.error('[api/admin/generate-description]', err);
    return res.status(500).json({ error: message });
  }
}
