# 🚂 RailMatch (АнтиРэйлМэтч)

> B2B-маркетплейс для железнодорожных грузоперевозок в России и СНГ

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-latest-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Telegram](https://img.shields.io/badge/Telegram-Mini_App-2CA5E0?logo=telegram&logoColor=white)](https://core.telegram.org/bots/webapps)

---

## Closed Pilot Release Flow

- Release branch for the pilot: `release/closed-pilot-v1`
- GitHub pull requests must target `release/closed-pilot-v1`
- GitHub CI must pass: `npm ci`, `npm run build`, `npm test`
- Vercel preview deployments come from pull requests
- Vercel production should point to `release/closed-pilot-v1`
- Frontend env vars must be stored in **Vercel Project Settings**, not in `vercel.json`
- Cloudflare stays **DNS-only** for `railmatch.ru` and `www.railmatch.ru`
- Cloudflare proxy must remain disabled for the pilot; Vercel serves TLS and frontend traffic

See [docs/closed-pilot-release-flow.md](docs/closed-pilot-release-flow.md) for the operational contract.

---

## 📋 О проекте

**RailMatch** — прямой маркетплейс, соединяющий грузоотправителей и владельцев вагонов без посредников-брокеров, которые традиционно берут **15–20%** от суммы сделки.

Платформа работает на чистой комиссионной модели: **2,5% от суммы сделки**. Комиссия разблокирует контакты обеих сторон — после её оплаты грузоотправитель и владелец вагонов видят реквизиты друг друга и завершают сделку напрямую. Комиссия может делиться поровну между сторонами (по 1,25% каждая).

---

## ✨ Ключевые возможности

- **Биржа грузов в реальном времени** — грузоотправители публикуют заявки, владельцы вагонов делают предложения
- **AI-парсер заявок** — создание заявок из произвольного текста на русском и казахском языках
- **4-этапный pipeline сделки**: переговоры → оплата комиссии → раскрытие контактов → подтверждение доставки
- **Антиутечка-система** — автоматическое обнаружение телефонов, мессенджеров и попыток обхода в чате; 4-уровневая эскалация: предупреждение → блокировка 24 ч → отзыв верификации → бан
- **Генерация документов** — договоры, УПД, накладные, акты сдачи-приёмки с водяными знаками (PDF)
- **Верификация компаний** — загрузка регистрационных документов, ручная проверка администратором
- **Telegram-интеграция** — уведомления, Mini App, бот @RailMatchBot
- **Дашборд аналитики** — KPI, конверсия, статистика выручки
- **Карта дислокации парка** — интерактивная карта России с позициями вагонов

---

## 👥 Роли пользователей

| Роль | Описание |
|---|---|
| **Грузоотправитель** | Публикует заявки на перевозку грузов |
| **Владелец вагонов** | Делает предложения по заявкам, управляет парком |
| **Демо** | Просмотр маркетплейса в режиме только для чтения |
| **Администратор** | Модерация платформы, верификация компаний |

---

## 🛠 Технологический стек

| Слой | Технологии |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| **Edge Functions** | TypeScript / Deno |
| **PDF** | html2canvas + jsPDF |
| **Графики** | Recharts |
| **Карты** | D3-geo + TopoJSON |
| **Telegram** | Mini App + Bot (Node.js / Express) |

---

## 🗂 Структура проекта

```
├── app.jsx                    # Корневой компонент (~1600 строк)
├── components/
│   ├── LandingScreen.jsx      # Лендинг и маркетинг
│   ├── AuthScreen.jsx         # Авторизация / регистрация
│   ├── ChatWindow.jsx         # Чат сделки, эскроу, документы (~65 КБ)
│   ├── MyRequestsView.jsx     # Управление заявками пользователя
│   ├── MyBidsView.jsx         # Предложения пользователя
│   ├── ProfileSettings.jsx    # Профиль, верификация, привязка Telegram
│   ├── AiAgentBar.jsx         # AI-создание заявок
│   ├── AnalyticsDashboard.jsx # KPI и графики
│   ├── FleetDislocation.jsx   # Карта дислокации парка
│   ├── AdminPanel.jsx         # Модерация
│   └── DocumentGenerator.js  # PDF-движок
├── src/
│   ├── supabaseClient.js      # Клиент Supabase
│   ├── constants.js           # PLATFORM_COMMISSION_RATE = 0.025
│   ├── security.js            # Антиутечка-валидация
│   └── aiService.js           # NLP-парсер
├── supabase/
│   └── functions/             # Edge Functions
├── migrations/                # 16 SQL-миграций
└── bot/                       # Telegram-бот (Node.js / Express)
```

---

## 🗄 Схема базы данных

| Таблица | Описание |
|---|---|
| `profiles` | Пользователи: имя, ИНН, роль, телефон, статус верификации, Telegram ID, нарушения |
| `requests` | Заявки на перевозку: маршрут, тип груза, тип вагона, объём |
| `bids` | Предложения/сделки: цена, статус, трекинг комиссии, раскрытие контактов |
| `messages` | Чат сделки с антиутечка-фильтрацией |
| `wagons` | Реестр парка вагонов |
| `deal_documents` | Договоры и акты |
| `violations` | Журнал модерации |

---

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- Аккаунт Supabase с созданным проектом

### Установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd anti_railmatch

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
```

Заполнить `.env`:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_TELEGRAM_BOT_USERNAME=RailMatchBot
```

### Запуск в режиме разработки

```bash
npm run dev
```

### Сборка для продакшена

```bash
npm run build
```

### Vercel окружение

Для preview и production-deploy фронтенда переменные `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` и `VITE_TELEGRAM_BOT_USERNAME` должны храниться в **Vercel Project Settings**. `vercel.json` больше не должен содержать встроенные env.

---

## 🗃 Настройка базы данных

1. Открыть SQL Editor в панели управления Supabase
2. Выполнить миграции из папки `/migrations/` **по порядку**
3. Обязательно применить `/migrations/14_auto_create_profile_trigger.sql` — триггер автоматического создания профиля для новых пользователей

---

## 🤖 Telegram-бот

Бот работает как отдельный сервис на Node.js / Express.

```bash
cd bot
npm install
node index.js
```

Необходимые переменные окружения для бота:

```env
TELEGRAM_BOT_TOKEN=<token>
BOT_WEBHOOK_SECRET=<secret>
BOT_PUBLIC_URL=https://<your-domain>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## 🔒 Антиутечка-система

Модуль `src/security.js` защищает комиссионную модель платформы, отслеживая в чате попытки обмена контактами напрямую:

- Телефонные номера в любом формате
- Ссылки на мессенджеры (WhatsApp, Telegram, Viber и др.)
- Другие попытки обхода платформы

**Эскалация нарушений:**

1. Предупреждение
2. Блокировка на 24 часа
3. Отзыв верификации компании
4. Постоянный бан

---

## 💰 Бизнес-модель

- **Комиссия платформы**: 2,5% от суммы сделки (`PLATFORM_COMMISSION_RATE = 0.025`)
- **Нет подписок** и фиксированных тарифов
- **Принцип работы**: комиссия разблокирует контакты → стороны завершают сделку напрямую
- Комиссия может делиться поровну между грузоотправителем и владельцем вагонов

---

## 📄 Лицензия

Проект является проприетарным. Все права защищены.
