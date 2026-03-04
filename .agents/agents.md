SYSTEM INSTRUCTION: RAILMATCH B2B PLATFORM DEVELOPER

1. КОНЦЕПЦИЯ ПРОДУКТА

RailMatch — это интеллектуальная B2B-экосистема для железнодорожной логистики. Платформа — двусторонняя биржа, где Грузоотправители (Shippers) и Владельцы вагонов (Owners) публикуют и находят предложения друг друга.
Главная цель: Прямая связь грузоотправителя и владельца вагонов, безопасные сделки через эскроу, прозрачная комиссия 2.5%.

2. ТЕХНИЧЕСКИЙ СТЕК И СТРУКТУРА

Архитектура: React Component-Based Architecture (Vite).
Frontend: React 18, Tailwind CSS, Lucide-Icons, html2canvas, jsPDF.
Шрифт: 'Manrope', sans-serif (Google Fonts).
Бэкенд: Supabase (Auth, PostgreSQL DB, Real-time Channels).

СТРУКТУРА ПРОЕКТА:
- app.jsx: Главный контроллер, навигация, глобальное состояние, подписки Supabase, обработчики сделок.
- components/LandingScreen.jsx: Лендинг с Hero, карточками для ролей, секцией «Как это работает», возможностями платформы и CTA.
- components/AuthScreen.jsx: Авторизация — вход/регистрация, выбор роли (shipper/owner), ИНН, телефон.
- components/RequestCard.jsx: Карточка заявки/вагонов на бирже (адаптируется под роль создателя).
- components/BidModal.jsx: Модалка отклика — ввод ставки и количества вагонов.
- components/CreateRequestForm.jsx: Универсальная форма публикации (заявка или вагоны).
- components/ChatWindow.jsx: Защищённый чат, deal stepper, модалки комиссии и эскроу, документы с водяными знаками.
- components/AiAgentBar.jsx: AI-агент для поиска/создания заявок из текста.
- components/AnalyticsDashboard.jsx: Дашборд аналитики с виджетами.
- components/FleetDislocation.jsx: Карта дислокации парка (контур России).
- components/MyRequestsView.jsx: Список публикаций текущего пользователя.
- components/MyBidsView.jsx: Список откликов/ставок текущего пользователя.
- components/ProfileSettings.jsx: Профиль, верификация, команда, уведомления, история сделок.
- components/SecurityManager.jsx: Маскировка контактов, стоп-слова, shadow flagging.
- components/DemoModal.jsx: Гостевой демо-режим.
- src/supabaseClient.js: Конфигурация клиента Supabase.

3. МОДЕЛЬ ДАННЫХ (SUPABASE)

- profiles: { id (uuid), company, inn, role (shipper/owner), phone, plan, verification_status, documents }
- requests: { id (uuid), shipperInn, stationFrom, stationTo, cargoType, wagonType, totalWagons, totalTons, fulfilledWagons, fulfilledTons, target_price, status (open/completed/closed), created_at }
- bids: { id (uuid), requestId, ownerId, ownerName, ownerPhone, price, wagons, tons, status (pending/pending_payment/escrow_held/loading/in_transit/accepted/rejected/canceled), shipper_confirmed, owner_confirmed, commission_accepted_shipper, commission_accepted_owner, escrow_confirmed_shipper, escrow_confirmed_owner, loading_confirmed_shipper, loading_confirmed_owner, transit_confirmed_shipper, transit_confirmed_owner, payment_doc_uploaded, loading_doc_uploaded, transit_doc_uploaded, act_doc_uploaded }
- messages: { id (uuid), chat_id, sender_id (text, supports 'system'), text, created_at }

4. ВИЗУАЛЬНЫЙ КОД (ПРЕМИАЛЬНЫЙ ФИНТЕХ)

Скругления: rounded-[2.5rem] для карточек, rounded-3xl для виджетов.
Эффекты: Glassmorphism (backdrop-blur), анимированные градиенты, тени shadow-xl/2xl.
Интерактивность: Анимации (float, glow), Hover-эффекты на кнопках (scale-95/active).
Темы: Полная поддержка Light/Dark тем через tailwind dark: классы.

5. БИЗНЕС-МОДЕЛЬ И МОНЕТИЗАЦИЯ

Комиссия: 2.5% от суммы сделки, удерживается с грузоотправителя (покупатель услуги).
Механизм: Средства замораживаются на эскроу-счёте до подписания акта обеими сторонами.
Формула: итого к оплате = (цена × вагоны) + round(цена × вагоны × 0.025).
Нет подписок/пакетов — единственный источник дохода это комиссия с успешных сделок.

6. ДВУСТОРОННЯЯ БИРЖА

Shipper публикует: Заявки на перевозку (маршрут, груз, тип вагона, кол-во, тонны, бюджет).
Owner публикует: Свободные вагоны (маршрут, тип вагона, кол-во, цена/вагон).
На бирже: Shipper видит вагоны Owners, Owner видит заявки Shippers.
Откликается: Owner на заявку Shipper → «Откликнуться». Shipper на вагоны Owner → «Заказать».
Лимит: Максимум 15 откликов на одну публикацию.

7. ПОЛНЫЙ PIPELINE СДЕЛКИ

Этап 1 — Переговоры (status: pending):
- Обмен сообщениями в защищённом чате.
- Контакты замаскированы. Стоп-слова блокируют обмен контактами.
- Каждая сторона нажимает «Оформить сделку» независимо.

Этап 2 — Принятие комиссии (status: pending_payment):
- Обе стороны видят модалку с условиями комиссии 2.5%.
- Owner принимает условия → ждёт оплату.
- Shipper принимает условия → вносит эскроу-платёж.

Этап 3 — Эскроу (status: escrow_held):
- Средства заморожены. Контакты партнёра полностью раскрыты.
- Документы доступны: Счёт, Договор-заявка, УПД, Реестр вагонов, Акт.

Этап 4 — Подача вагонов (escrow_held → loading):
- Owner подтверждает подачу вагонов.

Этап 5 — Погрузка (loading → in_transit):
- Shipper подтверждает погрузку груза.

Этап 6 — Доставка (in_transit → accepted):
- Оба подтверждают доставку независимо.
- Средства разморожены: деньги → Owner, комиссия 2.5% → RailMatch.

8. СИСТЕМА БЕЗОПАСНОСТИ

- Маскировка контактов до внесения эскроу.
- Стоп-слова и паттерны (телефоны, email, Telegram) блокируются в чате.
- Shadow flagging: 3+ попытки обхода → аккаунт на модерации.
- Документы с водяными знаками (userID + дата).
- Системные сообщения (sender_id: 'system') уведомляют о смене этапов.

9. ИНТЕРФЕЙС И ЯЗЫК

Язык: Русский.
Тон: Профессиональный B2B Финтех.
Код: Чистый React, компонентная архитектура для масштабируемости.