---
status: verifying
trigger: "На экране регистрации должна быть кнопка \"Войти через Telegram\", но её нет. Там где она должна быть — показывается ошибка \"Username invalid\"."
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - VITE_TELEGRAM_BOT_USERNAME в .env содержит "railmatch_bot", но реальный бот называется "rail_match_bot". Telegram Widget получает неверное имя и показывает "Username invalid".
test: Сравнить значение в .env с именем бота из коммита ad150ae (LandingScreen fix)
expecting: После исправления .env виджет загрузится корректно
next_action: Пересобрать проект (npm run build) и проверить что виджет отображается

## Symptoms

expected: На экране регистрации/входа (AuthScreen) должна быть кнопка "Войти через Telegram" (Telegram Login Widget или кастомная кнопка)
actual: Кнопки нет, вместо неё показывается "Username invalid"
errors: "Username invalid" — появляется там где должна быть TG кнопка
reproduction: Открыть экран регистрации/входа на сайте
started: С момента добавления в коммите 8e785cb (никогда не работала в продакшне из-за неверного имени бота)

## Eliminated

- hypothesis: onTelegramAuth не передаётся в AuthScreen
  evidence: В app.jsx строка 1373 явно передаётся onTelegramAuth={handleTelegramAuth}
  timestamp: 2026-04-01

- hypothesis: Виджет не рендерится из-за isDev=true
  evidence: Условие isDev выставляет placeholder только в dev. В production виджет рендерится через tg-widget-container. Проблема в username, не в isDev.
  timestamp: 2026-04-01

## Evidence

- timestamp: 2026-04-01
  checked: .env файл
  found: VITE_TELEGRAM_BOT_USERNAME=railmatch_bot
  implication: Имя бота без подчёркивания между "rail" и "match"

- timestamp: 2026-04-01
  checked: коммит ad150ae (fix landing bot link)
  found: Ссылка изменена с t.me/RailMatchBot на t.me/rail_match_bot
  implication: Реальный бот — rail_match_bot. В .env неверное имя — railmatch_bot.

- timestamp: 2026-04-01
  checked: components/AuthScreen.jsx строки 155-175
  found: script.setAttribute('data-telegram-login', botUsername) где botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME
  implication: Виджет получает "railmatch_bot" -> Telegram API возвращает "Username invalid"

- timestamp: 2026-04-01
  checked: dist/assets/index-C-OyoVvv.js
  found: Бандл не содержит telegram widget код — dist устаревший (собран до добавления виджета)
  implication: Нужен пересбор (npm run build) после правки .env

## Resolution

root_cause: VITE_TELEGRAM_BOT_USERNAME=railmatch_bot в .env — неверное имя бота. Правильное: rail_match_bot. Telegram Login Widget отправляет это имя в API и получает "Username invalid", что и отображается вместо кнопки.
fix: Изменить значение в .env на rail_match_bot и пересобрать проект
verification: awaiting rebuild + human check
files_changed:
  - .env
