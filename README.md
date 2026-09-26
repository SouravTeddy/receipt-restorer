# Thermal Receipt Restorer

Restores faded thermal-print receipts entirely client-side (a confidence-sweep
algorithm across 8 color channels finds faint ink no simple contrast filter
would catch), plus an optional server-side "Extract with AI" button that
sends the restored image to Claude for a first-pass reading — always
editable afterward, never auto-run.

## Local development

```bash
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY
vercel dev
```

## Deploying

```bash
vercel
```

Then set `ANTHROPIC_API_KEY` under Project Settings → Environment Variables
in the Vercel dashboard. It's read only by `api/extract.js`, server-side —
the browser never sees it.

## Cost note

Every click of "Extract with AI" is one billed Claude API call against
whatever key is configured. If this URL is shared publicly, consider adding
rate limiting or a shared-secret gate in `api/extract.js` before wide
distribution.
