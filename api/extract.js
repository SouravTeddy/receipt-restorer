import Anthropic from '@anthropic-ai/sdk';

// Server-side only. ANTHROPIC_API_KEY is read from the environment by the
// SDK's default client — it is never sent to or readable by the browser.
// This route is the only place in the whole project that touches it.
const client = new Anthropic();

const ALLOWED_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { image } = req.body || {};
  if (typeof image !== 'string') {
    res.status(400).json({ error: 'Missing image' });
    return;
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match || !ALLOWED_MEDIA_TYPES.has(match[1])) {
    res.status(400).json({ error: 'Invalid image format' });
    return;
  }
  const [, mediaType, data] = match;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            {
              type: 'text',
              text:
                'This is a photo of a receipt. Read every distinct horizontal line of ' +
                'printed text you can make out, top to bottom. Reply with only a JSON ' +
                'array of strings, one entry per line, in reading order top-to-bottom. ' +
                'Skip a line entirely if you cannot read it. No other text.',
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock ? textBlock.text : '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let lines = [];
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) lines = parsed.map((v) => String(v));
      } catch {
        // Leave lines empty — never guess at malformed output.
      }
    }

    res.status(200).json({ lines });
  } catch (err) {
    console.error('extract error:', err);
    res.status(502).json({ error: 'Extraction failed' });
  }
}
