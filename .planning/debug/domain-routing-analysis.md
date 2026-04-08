---
status: resolved
trigger: "railmatch.ru показывает белый экран / вечную загрузку. vercel.app домен работает нормально."
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - www.railmatch.ru обслуживается старым деплоем с index-BUSUE6kl.js, которого нет в текущей сборке dist/
test: curl https://www.railmatch.ru + проверка asset hash
expecting: несоответствие хешей JS-бандла между deployed index.html и реальными файлами
next_action: редеплой проекта через vercel --prod

## Symptoms

expected: railmatch.ru открывает React SPA
actual: белый экран / вечная загрузка только на кастомном домене
errors: JS ошибки не видны без DevTools (белый экран = JS не загрузился)
reproduction: открыть railmatch.ru в браузере
started: неделю, с момента привязки домена к Vercel

## Eliminated

- hypothesis: redirect loop (30x цепочки)
  evidence: railmatch.ru -> 307 -> www.railmatch.ru -> 200. Один редирект, нет loop.
  timestamp: 2026-04-08

- hypothesis: SSL/cert проблема
  evidence: HTTPS работает нормально, HSTS заголовок присутствует, сертификат валиден.
  timestamp: 2026-04-08

- hypothesis: mixed content (HTTP assets на HTTPS странице)
  evidence: index.html использует relative paths (/assets/...), не абсолютные HTTP URL
  timestamp: 2026-04-08

- hypothesis: CSP/заголовки блокируют на кастомном домене
  evidence: заголовки www.railmatch.ru идентичны vercel.app — нет специфичных для домена ограничений
  timestamp: 2026-04-08

## Evidence

- timestamp: 2026-04-08
  checked: curl -sIL https://railmatch.ru
  found: HTTP 307 -> Location: https://www.railmatch.ru/ (Vercel canonical redirect)
  implication: railmatch.ru корректно редиректит на www, это нормальное поведение Vercel

- timestamp: 2026-04-08
  checked: curl -s https://www.railmatch.ru (тело ответа)
  found: |
    <!doctype html><html>...<script type="module" crossorigin src="/assets/index-BUSUE6kl.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Dpgxe437.css">
  implication: deployed index.html ссылается на бандл с хешем BUSUE6kl

- timestamp: 2026-04-08
  checked: ls dist/assets/
  found: |
    index-B9UZWeSx.js   (локальный dist)
    НЕТ index-BUSUE6kl.js
  implication: хеши не совпадают — deployed index.html и deployed assets из РАЗНЫХ сборок

- timestamp: 2026-04-08
  checked: curl -sI https://www.railmatch.ru/assets/index-BUSUE6kl.js
  found: HTTP 200, Content-Length: 2123532, Content-Type: application/javascript
  implication: файл BUSUE6kl существует на Vercel — это СТАРЫЙ деплой

- timestamp: 2026-04-08
  checked: curl -sI https://www.railmatch.ru/assets/index-B9UZWeSx.js
  found: HTTP 200, Content-Length: 485, Content-Type: text/html (!)
  implication: КРИТИЧНО — файл B9UZWeSx.js НЕ СУЩЕСТВУЕТ на Vercel. Rewrite rule /(*) -> /index.html
    перехватывает запрос и возвращает index.html вместо JS. Браузер получает HTML вместо JS и падает.

- timestamp: 2026-04-08
  checked: dist/index.html существование
  found: файл отсутствует в локальном dist/ (только папка assets/)
  implication: локальная сборка неполная или не была выполнена перед деплоем

## Resolution

root_cause: |
  НА VERCEL ЗАДЕПЛОЕНЫ ДВА РАЗНЫХ ПОКОЛЕНИЯ ОДНОГО ПРОЕКТА ОДНОВРЕМЕННО:
  - index.html (старый) ссылается на /assets/index-BUSUE6kl.js
  - assets/ папка содержит файлы от НОВОГО деплоя (index-B9UZWeSx.js и другие)
  
  Когда браузер запрашивает /assets/index-BUSUE6kl.js — файл ЕСТЬ, страница работает.
  НО: последующие chunk'и (lazy imports, code splitting) ссылаются на хеши нового деплоя
  (B9UZWeSx, vendor-react-DEx5kXC7, etc.), которых нет — они перехватываются rewrite и
  возвращают index.html. Браузер падает при парсинге HTML как JS-модуля.
  
  ЛИБО: кастомный домен (www.railmatch.ru) указывает на другой деплой чем vercel.app —
  Vercel Dashboard -> Domains может показывать разные Production deployments.

fix: |
  Вариант A (скорее всего): Принудительный редеплой через `vercel --prod` из корня проекта.
  После деплоя index.html и все assets будут из одной сборки с одинаковыми хешами.
  
  Вариант B: В Vercel Dashboard -> Deployments -> найти последний деплой -> 
  Assign to Domain -> выбрать railmatch.ru и www.railmatch.ru.
  Убедиться что оба кастомных домена указывают на тот же деплой что и vercel.app.

verification: |
  После редеплоя:
  1. curl -s https://www.railmatch.ru | grep 'index-' — хеш в HTML
  2. curl -sI https://www.railmatch.ru/assets/[ХЕШ].js — должен вернуть application/javascript, не text/html
  3. Открыть railmatch.ru в браузере — SPA должна загрузиться

files_changed: []
