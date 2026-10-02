# Simple Review

Rebuilt as a hosted service: one customer page and a small business-link form.

## Run on this computer

Double-click `START.cmd`, then open `http://localhost:3001`. Keep the command window open. Node.js 22 or newer is required (already installed on this computer).

This starts the page and the AI endpoint together. A static server such as `serve` only displays the page; its `/api/generate` request returns an HTML 404 page and cannot generate reviews.

The local server reads `GEMINI_API_KEY` from the private `.env.local` file. That file is excluded from Git and the downloadable ZIP. The ZIP needs its own local key configuration if moved to another computer. Localhost is for testing on your laptop; businesses need the eventual published URL.

- Customers choose a detail or write their experience, use **Help me write it**, edit, then **Copy and open Google**.
- Open `/?setup` to enter a business name and its Google review link. Save the generated customer link. No account or code editing is needed for each business.
- The default business is Jaipur book bazaar; its existing Google Place ID was preserved.
- Business details travel in the customer URL. The link form stores no records and is not an admin dashboard.
- AI uses the server-side `GEMINI_API_KEY` secret. Without it, the page explains that AI is not connected; manual writing and copying still work.
- QR codes should point at each final customer URL, not at the setup page.

The current source is this folder. The previous Vercel prototype was backed up to `../../work/before-rebuild` before rebuilding and moved out of the deliverables to `../../work/legacy-review-generator`.

## Current status

- Mobile browser checks passed for editing, selections, business-link creation, clipboard/redirect control flow, error recovery, and light/dark display.
- Worker checks passed for input validation, missing configuration, mocked AI responses, and provider failures.
- The supplied Gemini key is configured as a secret in the registered Sites project. It is excluded from this source and archive.
- Publication is blocked: automatic approval review rejects input to the required source-publishing process. The site has not been published and there is no verified live URL.
- Local AI generation was verified with the supplied key. The original Gemini 2.5 Flash-Lite model returned a 404 for new users; the code now uses Gemini 3.5 Flash-Lite after verifying its availability through Google's models API. See [Google's model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).
- Real API requests succeeded in English, Hindi and Hinglish; the updated Hinglish prompt was also tested through the browser button. Initial responses took approximately 3 seconds; future speed and wording can vary.
- The HTML/JSON error is fixed in the frontend. The local Node server runs both the page and `/api/generate`; it must be used instead of a static-file server.

Developer checks: `node build.mjs` then `node check.mjs`. No project dependencies. The build emits a Cloudflare-compatible Worker for Sites publishing.

Hosting note: The earlier Vercel Hobby recommendation is unsuitable for selling this service because that plan allows personal, non-commercial use only. See [Vercel's plan terms](https://vercel.com/docs/plans/hobby). This rebuild uses Sites; confirm its account limits before offering commercial service guarantees.
