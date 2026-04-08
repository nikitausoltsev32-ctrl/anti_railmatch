---
phase: quick-1-telegram
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/functions/telegram-auth/index.ts
  - components/AuthScreen.jsx
  - components/LandingScreen.jsx
autonomous: false
requirements: [TG-AUTH-01, TG-AUTH-02]

must_haves:
  truths:
    - "Пользователь может войти в приложение нажав 'Войти через Telegram' без ввода email/пароля"
    - "После Telegram-входа профиль пользователя имеет telegram_id заполненным"
    - "Telegram-пользователь без существующего аккаунта проходит регистрацию (выбирает роль + компанию)"
  artifacts:
    - path: "supabase/functions/telegram-auth/index.ts"
      provides: "Верификация hash от Telegram Login Widget, создание/поиск пользователя, возврат Supabase session"
      exports: ["POST handler"]
    - path: "components/AuthScreen.jsx"
      provides: "Кнопка 'Войти через Telegram' + Telegram Login Widget script"
  key_links:
    - from: "components/AuthScreen.jsx"
      to: "supabase/functions/telegram-auth"
      via: "fetch POST с telegram auth data из widget callback"
    - from: "supabase/functions/telegram-auth"
      to: "supabase.auth.admin.createUser / signInWithPassword"
      via: "service role key создаёт или находит пользователя по telegram_id"
---

<objective>
Добавить вход через Telegram Login Widget на экране авторизации.

Purpose: Пользователи могут войти одним кликом через Telegram вместо email/пароля. telegram_id сразу заполняется в профиле — уведомления работают без дополнительной привязки.
Output: Edge Function telegram-auth + кнопка в AuthScreen + регистрация при первом входе.
</objective>

<execution_context>
@C:/Users/HomePc/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/HomePc/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

Архитектура аутентификации:
- Supabase Auth (email/password). Нет нативного Telegram провайдера.
- Существующая регистрация: Edge Function `send-confirmation-email` (не `supabase.auth.signUp` — см. решение 2026-03-21 в STATE.md)
- `profiles` таблица: id (UUID = auth.uid()), role, company, name, phone, telegram_id, telegram_username, telegram_link_token
- Триггер `on_auth_user_created` создаёт профиль при создании auth user

Существующий Telegram стек (уже задеплоен и работает):
- `telegram-notify` — отправка уведомлений по telegram_id
- `telegram-bot` + `verify-linking-code` — привязка через `/start TOKEN` в боте
- `ProfileSettings.jsx` — UI привязки Telegram для авторизованных пользователей (полностью готов)
- `app.jsx` строки 321-332 — автолинковка если открыто как Telegram Mini App

Нужный подход для входа (Telegram Login Widget):
1. Пользователь нажимает кнопку → срабатывает Telegram Login Widget (script от telegram.org)
2. Widget вызывает callback с объектом `{ id, first_name, username, hash, auth_date, ... }`
3. Фронтенд отправляет этот объект в Edge Function `telegram-auth`
4. Edge Function верифицирует HMAC-SHA256 hash (ключ = SHA256 от BOT_TOKEN)
5. Находит профиль по telegram_id ИЛИ создаёт нового пользователя:
   - Новый: `supabase.auth.admin.createUser({ email: fake_email, password: random, email_confirm: true })`
   - fake email паттерн: `tg_{telegram_id}@railmatch.internal`
   - После создания auth user — триггер создаёт профиль, затем UPDATE профиля с telegram_id + role
   - Возвращает: `{ needs_onboarding: true }` — фронтенд показывает форму выбора роли/компании
6. Существующий: находит user по `profiles.telegram_id`, вызывает `supabase.auth.admin.generateLink({ type: 'magiclink' })` для получения session
7. Edge Function возвращает `{ access_token, refresh_token }` — фронтенд вызывает `supabase.auth.setSession()`

Ограничения:
- Telegram Login Widget требует домен в настройках бота (BotFather → Bot Settings → Domain)
- Widget НЕ работает на localhost — нужен production URL или ngrok
- BOT_USERNAME нужен в переменных окружения (для data-telegram-login атрибута)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Edge Function telegram-auth — верификация hash и выдача session</name>
  <files>supabase/functions/telegram-auth/index.ts</files>
  <action>
Создать Edge Function `supabase/functions/telegram-auth/index.ts`.

POST endpoint, CORS headers (Access-Control-Allow-Origin: *, Allow-Headers: content-type).

Env vars используемые: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`.

**Верификация hash:**
```
data_check_string = sorted(all fields except hash, joined with '\n' as 'key=value')
secret_key = SHA256(BOT_TOKEN)  // не HMAC, просто SHA256
expected_hash = HMAC-SHA256(data_check_string, secret_key).hex()
if expected_hash !== received_hash → return 401
if auth_date < now - 86400 → return 401 (данные старше 24ч)
```

В Deno использовать Web Crypto API:
```typescript
const secretKey = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(botToken));
const hmacKey = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const signature = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(dataCheckString));
const hexHash = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
```

**Логика после верификации:**

1. Ищем профиль: `SELECT id, role FROM profiles WHERE telegram_id = $telegram_id`
2. Если найден И role не null → создаём magiclink session:
   ```typescript
   const { data } = await supabase.auth.admin.generateLink({
     type: 'magiclink',
     email: `tg_${telegramId}@railmatch.internal`,
   });
   // Затем signInWithPassword с временным паролем не работает
   // Используем admin.getUserById + admin.createSessionForUser если доступно,
   // иначе: вернуть { needs_session_via_otp: true, user_id } и использовать другой подход
   ```

   Более надёжный путь — хранить пароль: при создании пользователя сохранить случайный пароль в `profiles.telegram_auth_password` (или отдельная колонка). Нет — слишком сложно.

   **Реальный рабочий подход:** `supabase.auth.admin.generateLink` с type `'recovery'` или type `'email'` не даёт tokens напрямую. Вместо этого используем `supabase.auth.admin.signInWithOtp` — нет.

   **Используй:** `supabase.auth.admin.createSession({ user_id })` — метод доступен в supabase-js v2 service role. Возвращает `{ data: { session } }` с access_token + refresh_token.

   Если метод недоступен: fallback — `supabase.auth.admin.getUserById(userId)` → затем создать signed JWT вручную (не делать).

   Используй `supabase.auth.admin.createSession({ user_id: profile.id })` — это основной путь.

3. Если профиль НЕ найден → создаём пользователя:
   ```typescript
   const fakeEmail = `tg_${telegramId}@railmatch.internal`;
   const fakePassword = crypto.randomUUID();
   const { data: newUser } = await supabase.auth.admin.createUser({
     email: fakeEmail,
     password: fakePassword,
     email_confirm: true,
     user_metadata: { telegram_id: telegramId, telegram_username: username || null }
   });
   // Триггер создаст profiles запись. Затем обновим telegram_id:
   await supabase.from('profiles').update({
     telegram_id: telegramId,
     telegram_username: username || null,
   }).eq('id', newUser.user.id);

   const { data: sessionData } = await supabase.auth.admin.createSession({ user_id: newUser.user.id });
   return { needs_onboarding: true, access_token, refresh_token, ...sessionData.session }
   ```

4. Если профиль найден НО role = null (онбординг не завершён) → вернуть `{ needs_onboarding: true, ...session }`.

Response shape:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "needs_onboarding": false
}
```

Ошибки: 401 при неверном hash/устаревших данных, 400 при отсутствии обязательных полей, 500 при DB ошибках.
  </action>
  <verify>
    <automated>curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/telegram-auth -H "Content-Type: application/json" -d '{"id":0,"hash":"bad","auth_date":0}' | grep -q "Unauthorized\|Invalid\|error"</automated>
  </verify>
  <done>Edge Function отклоняет невалидный hash с 401, принимает валидный и возвращает access_token + refresh_token + needs_onboarding</done>
</task>

<task type="auto">
  <name>Task 2: AuthScreen — кнопка Telegram Login Widget + onboarding при первом входе</name>
  <files>components/AuthScreen.jsx, components/LandingScreen.jsx</files>
  <action>
**В AuthScreen.jsx:**

Добавить проп `onTelegramAuth` (функция, принимает tgData от widget callback).

Добавить секцию "Войти через Telegram" над формой email/password. Разделитель "или" между ними.

Telegram Login Widget подключается через динамическое создание script тега в useEffect:

```jsx
useEffect(() => {
  if (typeof window === 'undefined') return;
  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', process.env.VITE_TELEGRAM_BOT_USERNAME || window.__TELEGRAM_BOT_USERNAME__);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '12');
  script.setAttribute('data-onauth', 'onTelegramAuthCallback(user)');
  script.setAttribute('data-request-access', 'write');
  script.async = true;
  document.getElementById('tg-widget-container').appendChild(script);

  window.onTelegramAuthCallback = (user) => {
    if (onTelegramAuth) onTelegramAuth(user);
  };

  return () => {
    delete window.onTelegramAuthCallback;
  };
}, [onTelegramAuth]);
```

Добавить `<div id="tg-widget-container" className="flex justify-center my-4"></div>` в JSX.

Добавить разделитель между widget и формой:
```jsx
<div className="flex items-center gap-3 my-4">
  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">или</span>
  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
</div>
```

**Onboarding после Telegram-входа:**

Добавить в AuthScreen (или создать отдельный компонент внутри файла) `TelegramOnboarding` — минимальная форма для нового Telegram-пользователя:
- Выбор роли (owner / shipper) — такой же toggle как в register
- Поле "Ваше имя"
- Поле "Название компании"
- Поле "Телефон"
- Кнопка "Продолжить" → вызывает `onTelegramOnboardingSubmit({ role, name, company, phone })`

Этот компонент показывается когда `needsOnboarding === true` (проп из app.jsx).

**В LandingScreen.jsx:**

На кнопке "Войти" добавить примечание или не менять — Telegram виджет показывается уже на AuthScreen.

**В app.jsx** (не в files_modified выше, но нужно):

Добавить обработчик `handleTelegramAuth`:
```javascript
const handleTelegramAuth = async (tgData) => {
  setAuthLoading(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Telegram auth failed');

    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (data.needs_onboarding) {
      setScreen('telegram-onboarding');
    }
    // else: onAuthStateChange срабатывает и переводит в app
  } catch (err) {
    setAuthError(err.message);
  } finally {
    setAuthLoading(false);
  }
};
```

Добавить обработчик `handleTelegramOnboarding`:
```javascript
const handleTelegramOnboarding = async ({ role, name, company, phone }) => {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('profiles').update({ role, name, company, phone }).eq('id', user.id);
  setScreen('app'); // or let onAuthStateChange handle it
};
```

Передать `onTelegramAuth={handleTelegramAuth}` и `onTelegramOnboarding={handleTelegramOnboarding}` в AuthScreen.

Добавить `app.jsx` в files_modified для этой задачи — файл затрагивается.

**ENV переменная:**
Добавить `VITE_TELEGRAM_BOT_USERNAME` в `.env` (имя бота без @, например `railmatch_bot`). Это публичные данные — не секрет.

**ВАЖНО:** Widget не работает на localhost. В dev среде кнопка либо скрывается (`import.meta.env.DEV && return null`), либо показывается с пометкой "только в production".
  </action>
  <verify>
    <automated>grep -n "onTelegramAuth\|tg-widget-container\|telegram-widget" components/AuthScreen.jsx | head -10</automated>
  </verify>
  <done>
- AuthScreen показывает Telegram Login Widget кнопку (или заглушку в dev)
- При успешном Telegram-входе существующий пользователь попадает в приложение
- При первом входе нового пользователя показывается onboarding форма (роль + компания)
- После onboarding пользователь попадает в приложение с заполненным профилем и telegram_id
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    - Edge Function telegram-auth: верификация hash, создание/поиск пользователя, возврат session
    - AuthScreen: Telegram Login Widget + onboarding для новых пользователей
    - app.jsx: handleTelegramAuth + handleTelegramOnboarding handlers
  </what-built>
  <how-to-verify>
    1. Задеплоить Edge Function: `supabase functions deploy telegram-auth`
    2. Проверить что TELEGRAM_BOT_TOKEN установлен в Supabase secrets: `supabase secrets list`
    3. В BotFather → Bot Settings → Domain — указать production домен приложения
    4. Открыть production URL (не localhost)
    5. Нажать "Войти" → должна появиться кнопка Telegram Login Widget
    6. Кликнуть виджет → авторизоваться через Telegram
    7. Новый пользователь: должна появиться форма выбора роли и компании
    8. Заполнить форму → должен открыться основной экран приложения
    9. Проверить в Supabase: profiles запись должна иметь telegram_id заполненным
    10. Повторный вход (уже существующий пользователь) → сразу в приложение без онбординга
  </how-to-verify>
  <resume-signal>Введите "approved" или опишите проблему</resume-signal>
</task>

</tasks>

<verification>
- `supabase functions deploy telegram-auth` без ошибок
- Невалидный hash → 401 от Edge Function
- Валидный Telegram auth → access_token + refresh_token в ответе
- `supabase.auth.setSession()` создаёт сессию, onAuthStateChange срабатывает
- Профиль пользователя содержит telegram_id после входа
</verification>

<success_criteria>
1. Пользователь входит в приложение через Telegram без ввода email/пароля
2. telegram_id записан в profiles при первом входе
3. Новый пользователь проходит минимальный онбординг (роль + компания)
4. Уведомления работают сразу (telegram_id уже есть, привязка не нужна)
</success_criteria>

<output>
После завершения создать `.planning/quick/1-telegram/1-SUMMARY.md` с описанием что сделано, Edge Function URL, и замечаниями по deploy.
</output>
