# Simple Review

Rebuilt as a hosted service: one customer page and a small business-link form.

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
- Actual Gemini generation and its response time have not been verified. Do not treat the mock checks as a live AI test.

Developer checks: `node build.mjs` then `node check.mjs`. No project dependencies. The build emits a Cloudflare-compatible Worker for Sites publishing.

Hosting note: The earlier Vercel Hobby recommendation is unsuitable for selling this service because that plan allows personal, non-commercial use only. See [Vercel's plan terms](https://vercel.com/docs/plans/hobby). This rebuild uses Sites; confirm its account limits before offering commercial service guarantees.
