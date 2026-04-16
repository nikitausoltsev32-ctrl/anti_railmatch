# RailMatch Closed Pilot Release Flow

## Branch model

- `main` stays the long-lived integration branch.
- `release/closed-pilot-v1` is the only branch that deploys the closed pilot production frontend.
- All pilot fixes and features should open pull requests **into** `release/closed-pilot-v1`.
- Do not push directly to `release/closed-pilot-v1`; use pull requests with green CI.

## GitHub contract

- Every pull request runs `.github/workflows/ci.yml`.
- Required checks:
  - `npm ci`
  - `npm run build`
  - `npm test`
- `bug-bots.yml` stays separate and is not part of the release gate.

## Vercel contract

- Vercel is the only frontend runtime for the pilot.
- Preview deployments should come from pull requests.
- Production branch in Vercel should be set to `release/closed-pilot-v1`.
- Frontend environment variables must live in **Vercel Project Settings**, not in `vercel.json`.

### Required frontend env vars

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_TELEGRAM_BOT_USERNAME`

## Bot and backend contract

- Supabase remains the backend platform.
- Supabase secrets stay in Supabase.
- The Telegram bot remains an external runtime with its own `BOT_PUBLIC_URL`.
- Bot environment variables stay outside Vercel.

## Cloudflare contract

- Cloudflare is DNS-only for the pilot.
- `railmatch.ru` and `www.railmatch.ru` must stay **unproxied**.
- TLS termination and edge serving should come from Vercel, not from Cloudflare proxy.
- Re-enabling Cloudflare proxy is a separate future hardening task.
