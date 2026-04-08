---
status: diagnosed
trigger: "React SPA на railmatch.ru показывает белый экран. На Vercel-домене работает."
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: vite.config.js жёстко прописывает env-vars через define{} в бандл — но dist/ устарел, его нет на хостинге. Реальная причина: railmatch.ru обслуживается через Netlify (netlify.toml без [build] секции верхнего уровня), и там VITE_SUPABASE_URL/KEY могут не попадать в бандл — createClient(undefined, undefined) → supabase SDK кидает исключение при первом запросе → ErrorBoundary (в DEV показывает ошибку, в PROD — белый экран до монтирования).
test: проверить, что попало в бандл dist/assets/index-*.js
expecting: если URL/KEY undefined в бандле — это корень проблемы
next_action: ДИАГНОСТИКА ЗАВЕРШЕНА — см. Resolution

## Symptoms

expected: SPA загружается и рендерится на railmatch.ru
actual: белый экран только на railmatch.ru, на Vercel работает
errors: неизвестно (нет browser console logs)
reproduction: открыть railmatch.ru
started: неизвестно

## Eliminated

- hypothesis: Telegram WebApp SDK блокирует рендер
  evidence: код в app.jsx проверяет `if (!window.Telegram?.WebApp) return;` — при отсутствии SDK просто пропускает инициализацию, не бросает ошибку
  timestamp: 2026-04-08

- hypothesis: ErrorBoundary поглощает ошибку без отображения
  evidence: ErrorBoundary показывает экран ошибки (не белый лист) — НЕ является причиной белого экрана

- hypothesis: domain-specific код в app.jsx / LandingScreen.jsx
  evidence: grep по window.location/hostname/origin — нет проверок домена. Только window.location.origin используется для redirectTo при регистрации (безопасно)

- hypothesis: Supabase config.toml с ограничениями по allowed origins
  evidence: supabase/config.toml отсутствует в репозитории

## Evidence

- timestamp: 2026-04-08
  checked: vite.config.js
  found: define{} блок жёстко вшивает VITE_SUPABASE_URL и VITE_SUPABASE_KEY прямо в бандл через JSON.stringify. Это значит значения будут в бандле независимо от env vars на хостинге.
  implication: env vars на Netlify НЕ являются причиной проблемы — они уже в бандле

- timestamp: 2026-04-08
  checked: dist/ директория
  found: dist/assets/ содержит JS бандлы, но dist/index.html НЕ СУЩЕСТВУЕТ
  implication: КРИТИЧНО — dist/ неполный. Если railmatch.ru деплоит из dist/, то index.html отсутствует → хостинг отдаёт 404 или пустую страницу → белый экран

- timestamp: 2026-04-08
  checked: dist/assets/index-B9UZWeSx.js
  found: содержит supabase.co URL — Supabase URL в бандле есть
  implication: env vars OK в бандле

- timestamp: 2026-04-08
  checked: vercel.json
  found: buildCommand="npm run build", outputDirectory="dist", rewrites SPA. Нет netlify.toml файла в репо.
  implication: Проект настроен на Vercel. railmatch.ru = Vercel домен с custom domain.

- timestamp: 2026-04-08
  checked: vercel.json build.env секция
  found: VITE_TELEGRAM_BOT_USERNAME="rail_match_bot" (с подчёркиванием), но в vite.config.js define{} прописан "railmatch_bot" (без "rail_"). Два разных значения.
  implication: Telegram bot username конфликт — но это не причина белого экрана

- timestamp: 2026-04-08
  checked: dist/index.html
  found: файл НЕ СУЩЕСТВУЕТ (dist/assets/ есть, но dist/index.html нет)
  implication: ГЛАВНАЯ НАХОДКА — папка dist неполная. Либо последний `npm run build` не завершился, либо dist/index.html был удалён/не закоммичен

## Resolution

root_cause: dist/index.html отсутствует в папке dist/. Если railmatch.ru деплоится из локальной dist/ директории (через Vercel CLI или ручной upload), хостинг не имеет точки входа для SPA → белый экран / 404. Либо последний билд не был запущен перед деплоем после изменений в index.html или vite.config.js.

Второстепенная находка: vite.config.js define{} жёстко вшивает credentials прямо в JS-код (не через .env механизм) — это работает, но credentials видны в исходниках бандла.

fix: запустить `npm run build` заново → убедиться что dist/index.html создан → задеплоить

verification: не применялся (режим find_root_cause_only)
files_changed: []
