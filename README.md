# Thermal Receipt Restorer

Restores faded thermal-print receipts entirely client-side — a confidence-sweep
algorithm sweeps 8 color channels across 9 sensitivity thresholds and finds
faint ink that a simple brightness/contrast filter would miss.

It's a single static HTML file. No build step, no server, no backend, no API
keys, no dependencies.

**Live demo:** [receipt-restorer.vercel.app](https://receipt-restorer.vercel.app)

## Install / run it

Clone the repo and open the file directly:

```bash
git clone https://github.com/SouravTeddy/receipt-restorer.git
cd receipt-restorer
open index.html   # or just double-click it
```

To host it publicly, deploy it as a static file anywhere — Vercel, Netlify,
GitHub Pages, or any static file host all work with zero configuration since
there's nothing to build:

```bash
npx vercel --prod
```

## Adding an AI "extract text" feature

This repo doesn't include AI-powered text extraction — there's no API key,
no server code, and no way for a visitor to trigger one. If you want to add
that yourself in your own fork:

1. You'll need a backend, since an API key must never be sent to or embedded
   in browser-side code. Add a small server function (e.g. a Vercel
   serverless function under `api/`) that calls an LLM vision API server-side
   and returns the extracted text.
2. Store the API key as a platform environment variable (e.g. Vercel Project
   Settings → Environment Variables) — never hardcode it into any file.
3. From `index.html`, add a button that `POST`s the canvas image
   (`outCanvas.toDataURL('image/png')`) to your new endpoint and displays
   whatever it returns.
4. If you expect public traffic, add rate limiting or a shared-secret check
   in your endpoint — every call is a billed API request.

## Removing the "support dev" promo line

The top banner ("Support dev — download Elara · follow on X and LinkedIn")
is one self-contained block. To remove it entirely, delete these three
pieces from `index.html`:

1. The CSS block starting with `#promoBar {` through the `#promoBar a:hover`
   rule right after it (five rules total, all adjacent in the file).
2. The `<div id="promoBar">...</div>` markup in the body.
3. The two JS lines that toggle it: `promoBar.classList.add('active')` (in
   `loadFile`) and `promoBar.classList.remove('active')` (in the retry
   button's handler) — plus the `const promoBar = ...` line near the top of
   the script.

Search for `promoBar` in the file — every reference is one of those four
spots.

## License

MIT — free to use, modify, and ship, as long as you keep the copyright
notice. See [LICENSE](LICENSE).
