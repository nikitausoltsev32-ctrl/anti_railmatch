---
status: fixing
trigger: "Сайт railmatch.ru не открывается через кастомный домен, хотя через Vercel-домен (railmatch.vercel.app) работает."
created: 2026-04-03T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — DNS корректен (NS=vercel-dns.com, A=216.198.79.x — Vercel IP). Vercel пересобирает из исходников без .env, VITE_ переменные undefined, Supabase client broken, getSession() не резолвится, authChecking=true вечно, спиннер. Fix: создать vercel.json с env секцией.
test: создан vercel.json с VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TELEGRAM_BOT_USERNAME и SPA redirect
expecting: Vercel подхватит env vars при следующем деплое, getSession() резолвится, app рендерится
next_action: пользователь делает git push и проверяет railmatch.ru

## Symptoms

expected: Открывается React-приложение на railmatch.ru
actual: Пустая страница (спиннер крутится бесконечно) или сайт не загружается
errors: |
  - ReferenceError: Cannot access 'userProfile' before initialization — ИСПРАВЛЕНО
  - ERR_HTTP2_PING_FAILED на 2MB JS бандл — ИСПРАВЛЕНО (чанки разбиты)
  - Бесконечный спиннер — причина: VITE_ env vars отсутствуют на хостинге
reproduction: Открыть railmatch.ru в браузере
started: неделю назад, DNS по словам пользователя разошёлся

## Eliminated

- hypothesis: userProfile TDZ error causes blank page
  evidence: уже исправлено, но сайт всё равно не грузится
  timestamp: 2026-04-03

- hypothesis: DNS/Vercel deployment issue
  evidence: DNS работает — NS=ns1.vercel-dns.com, A=216.198.79.1 (Vercel IP). Домен управляется Vercel DNS.
  timestamp: 2026-04-03

- hypothesis: manualChunks object config работает для react/react-dom
  evidence: vendor-react-DKEJIzC6.js = 69 bytes (только re-exports), react internals в main chunk. Fixed with manualChunks function form.
  timestamp: 2026-04-03

- hypothesis: Netlify publish dir или SPA redirect неправильно настроены
  evidence: netlify.toml правильный — но деплой теперь на Vercel, не Netlify
  timestamp: 2026-04-06

- hypothesis: vite.config.js имеет неправильный base
  evidence: base не задан (defaults to "/") — правильно
  timestamp: 2026-04-06

- hypothesis: DNS не разошёлся или ведёт не на Vercel
  evidence: nslookup railmatch.ru → 216.198.79.1, 216.198.79.65 (оба Vercel IP). NS = ns1.vercel-dns.com, ns2.vercel-dns.com. DNS полностью корректен.
  timestamp: 2026-04-08

## Evidence

- timestamp: 2026-04-03T00:01:00Z
  checked: dist/assets/ file sizes
  found: index-Djo_GESn.js = 993KB, vendor-react = 69 bytes, vendor-maps = 1 byte
  implication: manualChunks config broken — react not actually splitting

- timestamp: 2026-04-03T00:05:00Z
  checked: Vite build output
  found: "Generated an empty chunk: vendor-maps" warning, vendor-react=0.07KB
  implication: Both vendor-react and vendor-maps are effectively empty — manualChunks object form fails for pre-bundled CJS

- timestamp: 2026-04-06T00:03:00Z
  checked: .gitignore
  found: .env on line 69, dist/ on line 83 — both gitignored
  implication: Хостинг строит без .env; npm run build без VITE_ vars

- timestamp: 2026-04-06T00:05:00Z
  checked: app.jsx authChecking logic
  found: authChecking=true на init, set false только после supabase.auth.getSession() resolves; если Supabase client broken (undefined URL/key) — getSession() зависает
  implication: Точный механизм бесконечного спиннера

- timestamp: 2026-04-08T00:01:00Z
  checked: DNS railmatch.ru через Google DNS (8.8.8.8)
  found: A = 216.198.79.1, 216.198.79.65 (оба принадлежат Vercel Inc); NS = ns1.vercel-dns.com, ns2.vercel-dns.com
  implication: DNS полностью корректен. Домен управляется Vercel DNS и направлен на Vercel. Проблема не в DNS.

- timestamp: 2026-04-08T00:02:00Z
  checked: vercel.json
  found: файл отсутствует
  implication: Нет SPA redirect (/* -> /index.html) и нет env vars для Vercel build

- timestamp: 2026-04-08T00:03:00Z
  checked: netlify.toml [build.environment]
  found: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TELEGRAM_BOT_USERNAME — все три есть
  implication: На Netlify fix работал бы, но деплой на Vercel — netlify.toml Vercel игнорирует

## Resolution

root_cause: |
  DNS корректен — A-записи ведут на Vercel IP, NS управляется Vercel.
  Vercel пересобирает проект командой `npm run build` без .env файла (gitignored).
  В результате: VITE_SUPABASE_URL=undefined, VITE_SUPABASE_ANON_KEY=undefined.
  createClient(undefined, undefined) создаёт broken Supabase client.
  supabase.auth.getSession() на broken client никогда не резолвит промис.
  authChecking=true навсегда → приложение рендерит только спиннер.
  Дополнительно: без vercel.json нет SPA redirect — прямые URL (/profile и т.п.) вернут 404.

fix: |
  Создан vercel.json с:
  1. env секцией — все три VITE_ переменные для build time
  2. rewrites /* -> /index.html — SPA routing для React Router

verification: ожидает git push и подтверждения пользователя
files_changed:
  - vercel.json (создан)
