---
status: diagnosed
trigger: "vercel-build-env-vars — Vite-приложение на Vercel собирается без VITE_SUPABASE_URL/KEY"
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: Deployed bundle (index-BUSUE6kl.js) was built BEFORE vite.config.js define block was added — it's a stale Vercel deployment. The local dist has a different hash (index-B9UZWeSx.js) which DOES contain the URL.
test: Compare bundle hash in live site vs local dist. Check if vite.config.js define block is committed/pushed.
expecting: Live bundle does NOT contain Supabase URL because it predates the define fix.
next_action: Verify vite.config.js is committed and pushed; check if Vercel has re-deployed.

## Symptoms

expected: VITE_SUPABASE_URL присутствует в собранном JS-бандле
actual: curl на бандл не находит Supabase URL (unverified — background task was denied)
errors: белый экран на railmatch.ru
reproduction: curl -s https://www.railmatch.ru | grep src assets, затем curl бандл и grep supabase URL
started: После попыток через vercel.json env/build.env

## Eliminated

- hypothesis: vite.config.js не содержит define секции
  evidence: Файл содержит полный define блок с VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TELEGRAM_BOT_USERNAME
  timestamp: 2026-04-08

- hypothesis: Локальный build не содержит URL
  evidence: dist/assets/index-B9UZWeSx.js содержит "xakyjvlxypivrmuehsxl" (2+ matches found by grep)
  timestamp: 2026-04-08

## Evidence

- timestamp: 2026-04-08
  checked: vite.config.js
  found: define block hardcodes VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TELEGRAM_BOT_USERNAME using JSON.stringify
  implication: Local builds will always embed these values. Config is correct.

- timestamp: 2026-04-08
  checked: vercel.json
  found: build.env section with all 3 VITE_ variables. BUT "build.env" is NOT a valid Vercel config key. Valid keys are "env" (runtime) and "buildEnv" or setting env vars in Vercel dashboard. The "build": {"env": ...} nesting may be silently ignored.
  implication: vercel.json env injection may have never worked; define in vite.config.js is the correct workaround.

- timestamp: 2026-04-08
  checked: Live site bundle hash vs local dist hash
  found: Live site serves index-BUSUE6kl.js; local dist has index-B9UZWeSx.js — DIFFERENT hashes
  implication: The live deployment predates the local build. Vercel has NOT yet deployed the version with define in vite.config.js.

- timestamp: 2026-04-08
  checked: git status
  found: vite.config.js appears in modified files (M vite.config.js) — meaning it is MODIFIED but the deploy at railmatch.ru uses an older bundle
  implication: vite.config.js with define block may not be committed+pushed yet, OR Vercel hasn't triggered a new build.

- timestamp: 2026-04-08
  checked: index.html
  found: <script src="https://telegram.org/js/telegram-web-app.js" defer></script>
  implication: Script uses "defer" so it should NOT block page render. Not a blocking issue.

- timestamp: 2026-04-08
  checked: src/supabaseClient.js
  found: Uses import.meta.env.VITE_SUPABASE_URL/ANON_KEY directly, no fallback. If these are undefined, createClient() is called with undefined arguments.
  implication: If Supabase URL is undefined, createClient throws or returns a broken client. getSession() would then throw, hitting the .catch() which calls setAuthChecking(false). App would NOT get stuck on spinner — it would show landing screen. White screen must have another cause.

- timestamp: 2026-04-08
  checked: app.jsx authChecking flow
  found: authChecking starts true, shows spinner. On getSession() success (no session) or .catch(), setAuthChecking(false) is called. So white screen is NOT caused by infinite authChecking.
  implication: If white screen persists even when Supabase URL is undefined, another JS error is crashing the component tree before render. ErrorBoundary is imported but we don't know if it wraps the full app.

## Resolution

root_cause: |
  vite.config.js with define block is LOCALLY MODIFIED but NOT COMMITTED. 
  Git status shows "M vite.config.js" — the file has not been staged or committed.
  The live Vercel deployment (bundle hash BUSUE6kl) was built from a prior commit that lacked the define section.
  The local dist (hash B9UZWeSx) contains the URL correctly because it was built locally from the working tree.
  
  Why white screen (not just broken data): When Supabase URL is undefined, createClient(undefined, undefined) 
  creates a broken client. getSession() rejects → .catch() fires → setAuthChecking(false). 
  App then renders screen=landing (from localStorage). LandingScreen import itself works. 
  BUT: any component that calls supabase on mount (realtime subscriptions, etc.) may throw unhandled 
  errors that crash child components. ErrorBoundary only wraps the main app div, not the import-level 
  module initialization. If supabase module throws during import... actually Supabase's createClient 
  does NOT throw on undefined URL — it silently creates a broken client. So white screen more likely 
  from a different JS error in the stale bundle itself (e.g. missing component, syntax error in old code).

fix: |
  1. git add vite.config.js && git commit -m "fix(build): hardcode VITE_ env vars in vite.config.js define block" && git push
  2. Vercel will auto-trigger rebuild; new bundle will embed the Supabase URL directly
  3. vercel.json "build.env" key is NOT a valid Vercel config schema key — it is silently ignored. 
     The correct key for build-time env is "buildEnv" or setting vars in the Vercel dashboard.
     The define approach in vite.config.js is the correct workaround and will work once pushed.

verification: empty
files_changed: [vite.config.js]
