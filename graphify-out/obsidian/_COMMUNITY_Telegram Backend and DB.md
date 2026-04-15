---
type: community
cohesion: 0.07
members: 38
---

# Telegram Backend and DB

**Cohesion:** 0.07 - loosely connected
**Members:** 38 nodes

## Members
- [[AdminPanel Component]] - code - components/AdminPanel.jsx
- [[Bot Start Handler]] - code - bot/handlers/startHandler.js
- [[Bot Telegram Library sendMessageregisterWebhook]] - code - bot/lib/telegram.js
- [[DeveloperDashboard]] - code - components/DeveloperDashboard.jsx
- [[MIN_PRICE_PER_WAGON 30000 RUB Floor Price]] - code - src/constants.js
- [[MyBidsView]] - code - components/MyBidsView.jsx
- [[MyRequestsView]] - code - components/MyRequestsView.jsx
- [[OnboardingModal]] - code - components/OnboardingModal.jsx
- [[Resend API - Email Delivery Service]] - document
- [[Resend Email API]] - document
- [[Telegram Bot API]] - document
- [[Telegram Bot API - Messaging Service]] - document
- [[Telegram Bot Server Express]] - code - bot/index.js
- [[User Roles shipperownerdeveloperdemo]] - document - components/DeveloperDashboard.jsx
- [[UserDashboard]] - code - components/UserDashboard.jsx
- [[aiService (parsePrompt)]] - code - src/aiService.js
- [[bids DB Table]] - document
- [[broadcasts DB Table]] - document
- [[error_logs DB Table]] - document
- [[get-demo-data - Edge Function Unauthenticated Demo Data]] - code - supabase/functions/get-demo-data/index.ts
- [[get-demo-data Edge Function (anti)]] - code - anti_railmatch/supabase/functions/get-demo-data/index.ts
- [[haptic - Telegram WebApp Haptic Feedback Adapter]] - code - src/haptic.js
- [[messages DB Table]] - document
- [[notify - Edge Function Transactional Email via Resend]] - code - supabase/functions/notify/index.ts
- [[notify Edge Function - Resend Email (anti)]] - code - anti_railmatch/supabase/functions/notify/index.ts
- [[profiles DB Table]] - document
- [[requests DB Table]] - document
- [[send-confirmation-email - Edge Function Registration Email]] - code - supabase/functions/send-confirmation-email/index.ts
- [[send-confirmation-email Edge Function (anti)]] - code - anti_railmatch/supabase/functions/send-confirmation-email/index.ts
- [[telegram-auth - Edge Function Telegram Login Widget Auth]] - code - supabase/functions/telegram-auth/index.ts
- [[telegram-bot - Edge Function Telegram Bot Webhook Handler]] - code - supabase/functions/telegram-bot/index.ts
- [[telegram-bot Edge Function (anti)]] - code - anti_railmatch/supabase/functions/telegram-bot/index.ts
- [[telegram-broadcast - Edge Function Admin Broadcast]] - code - supabase/functions/telegram-broadcast/index.ts
- [[telegram-broadcast Edge Function (anti)]] - code - anti_railmatch/supabase/functions/telegram-broadcast/index.ts
- [[telegram-notify - Edge Function Per-user Telegram Notification]] - code - supabase/functions/telegram-notify/index.ts
- [[telegram-notify Edge Function (anti)]] - code - anti_railmatch/supabase/functions/telegram-notify/index.ts
- [[verify-linking-code - Edge Function Telegram Account Linking]] - code - supabase/functions/verify-linking-code/index.ts
- [[verify-linking-code Edge Function (anti)]] - code - anti_railmatch/supabase/functions/verify-linking-code/index.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Telegram_Backend_and_DB
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Core UI Screens]]

## Top bridge nodes
- [[profiles DB Table]] - degree 17, connects to 1 community