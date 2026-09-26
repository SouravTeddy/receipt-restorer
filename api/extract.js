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
                'printed text you can make out. For each line, also estimate its bounding ' +
                'box as a FRACTION of the image width/height (0 = left/top edge, 1 = ' +
                'right/bottom edge of the whole image) — not pixels. Reply with only a ' +
                'JSON array, one object per line, in this exact shape: ' +
                '{"text": "...", "x0": 0.0, "x1": 0.0, "y0": 0.0, "y1": 0.0} ' +
                '(x0/x1 = left/right extent of that line\'s text, y0/y1 = top/bottom extent). ' +
                'Order the array top-to-bottom by y0. Skip a line entirely if you cannot ' +
                'read it. No other text, no markdown fences.',
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
        if (Array.isArray(parsed)) {
          const clamp = (v) => Math.max(0, Math.min(1, Number(v)));
          lines = parsed
            .filter((v) => v && typeof v.text === 'string' && v.text.trim() !== '')
            .map((v) => ({
              text: v.text,
              x0: clamp(v.x0),
              x1: clamp(v.x1),
              y0: clamp(v.y0),
              y1: clamp(v.y1),
            }))
            .filter((v) => Number.isFinite(v.x0) && Number.isFinite(v.x1) && Number.isFinite(v.y0) && Number.isFinite(v.y1) && v.x1 > v.x0 && v.y1 > v.y0);
        }
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
