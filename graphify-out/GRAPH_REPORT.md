# Graph Report - C:/Users/HomePc/Railmatch Anti  (2026-04-11)

## Corpus Check
- 139 files · ~240,950 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 300 nodes · 322 edges · 80 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `validateMessageIntent()` - 17 edges
2. `renderContract()` - 10 edges
3. `renderAct()` - 10 edges
4. `generateDocument()` - 10 edges
5. `addWatermark()` - 9 edges
6. `renderUPD()` - 9 edges
7. `renderWaybill()` - 8 edges
8. `RailMatch README B2B Rail Freight Marketplace` - 8 edges
9. `addHeader()` - 7 edges
10. `addSignatures()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Fleet Dislocation Map Interactive Russia Map` --references--> `Russia Map SVG Root`  [INFERRED]
  README.md → russia.svg
- `Chat UX Dialog List Main Chat Area` --conceptually_related_to--> `Anti-Leak Contact Detection System`  [INFERRED]
  scripts/demo_tab_4.png → README.md
- `Violation Threshold Constants - Chat Safety Levels` --rationale_for--> `validateMessageIntent()`  [INFERRED]
  src/constants.js → C:\Users\HomePc\Railmatch Anti\src\security.js
- `Exchange Birzha UX Cargo Cards AI Bar Demo Banner` --implements--> `AI Agent Bar for NLP Request Creation`  [EXTRACTED]
  scripts/demo_tab_0.png → product.txt
- `parsePrompt()` --references--> `WAGON_TYPES - Wagon Type Synonyms Dictionary`  [EXTRACTED]
  C:\Users\HomePc\Railmatch Anti\src\aiService.js → src/aiService.js

## Hyperedges (group relationships)
- **AI Prompt Parsing in Views** — mybidsview_component, myrequestsview_component, aiservice_module [EXTRACTED 0.95]
- **Profile View Rate Limiting Security** — securitymanager_component, profileviewmonitor_component, profileaccessguard_component [INFERRED 0.85]
- **Telegram Account Linking Flow** — bot_startHandler, fn_verifyLinkingCode, db_profiles, ext_telegramApi [EXTRACTED 1.00]
- **Email Notification System Resend** — fn_notify, fn_sendConfirmationEmail, ext_resend [EXTRACTED 1.00]
- **AI NLP Search/Create Pipeline** — comp_aiAgentBar, aiservice_parsePrompt, aiservice_getMissingFields, aiservice_getClarificationQuestion [EXTRACTED 1.00]
- **Chat Security Enforcement** — comp_chatWindow, security_validateMessageIntent, security_stopWords, constants_violationThresholds [EXTRACTED 0.90]
- **Admin Telegram Broadcast Flow** — comp_adminPanel, fn_telegramBroadcast, db_broadcasts, ext_telegramApi [INFERRED 0.80]
- **Document Signing Flow** — docsign_documentsigningmodal, docgen_documentgenerator, concept_platformcommission, concept_electronicSignature [EXTRACTED 0.95]
- **Developer Admin Monitoring** — devdash_developerdashboard, db_profiles, db_requests, db_bids, db_messages, db_errorlogs [EXTRACTED 1.00]
- **Profile View Rate Limiting System** — profilemon_profileviewmonitor, secmgr_securitymanager, concept_dailylimit, concept_escrow [INFERRED 0.85]
- **Role-Based UX Components** — democomponent_demomodal, onboard_onboardingmodal, userdash_userdashboard, concept_rolesdomain [INFERRED 0.85]
- **Playwright Pre-Deploy Test Suite** — testapp_testapp, testdeep_testdeep, testdemo_testdemo, testfinal_testfinal [EXTRACTED 0.95]
- **Telegram Integration Functions** — telegramauth_fn, telegrambot_fn, telegrambroadcast_fn, telegramnotify_fn, verifylinkingcode_fn, haptic_haptic [INFERRED 0.85]
- **NLP Prompt Parser Components** — aiservice_parseprompt, aiservice_getmissingfields, aiservice_getclarificationquestion, aiservice_wagontypes, aiservice_cargotypes, aiservice_cityabbreviations [EXTRACTED 0.95]
- **Chat Anti-Leakage Security System** — security_validatemessageintent, security_validatemessagesequence, security_stopwords, security_detectors, constants_violationthresholds [INFERRED 0.90]
- **RailMatch Core Documentation Set** — product_txt_railmatch, readme_railmatch, claude_md_railmatch [EXTRACTED 0.95]
- **Commission Model Protected by Anti-Leak System** — concept_commission_model, concept_anti_leak_system, concept_deal_pipeline [EXTRACTED 1.00]
- **RailMatch Core Application Screens** — final_01_exchange, final_02_analytics, final_03_messages, final_04_my_requests, final_05_my_bids, final_07_mobile [EXTRACTED 1.00]
- **AI-Powered RailMatch Features** — feature_ai_agent, ui_smart_suggestions, feature_my_requests, feature_my_bids [INFERRED 0.85]

## Communities

### Community 0 - "Telegram Backend and DB"
Cohesion: 0.07
Nodes (38): Telegram Bot Server Express, Bot Start Handler, Bot Telegram Library sendMessage/registerWebhook, AdminPanel Component, User Roles shipper/owner/developer/demo, MIN_PRICE_PER_WAGON 30000 RUB Floor Price, bids DB Table, broadcasts DB Table (+30 more)

### Community 1 - "React UI Components"
Cohesion: 0.07
Nodes (0): 

### Community 2 - "Document Generator"
Cohesion: 0.29
Nodes (20): addFooter(), addHeader(), addPartyBlock(), addSignatures(), addWatermark(), checkPage(), downloadDocument(), drawTableRow() (+12 more)

### Community 3 - "Security and Anti-Leak"
Cohesion: 0.2
Nodes (17): Violation Threshold Constants - Chat Safety Levels, detectCompanyName(), detectEmail(), detectFullName(), detectLatinUsername(), detectMessenger(), detectObfuscated(), Security Detectors - Phone/Messenger/Email/URL/Name (+9 more)

### Community 4 - "AI NLP Service"
Cohesion: 0.15
Nodes (7): CARGO_TYPES - Cargo Type Synonyms Dictionary, CITY_ABBREVIATIONS - Russian City Abbreviation Map, getClarificationQuestion(), getMissingFields(), parsePrompt(), resolveCityName(), WAGON_TYPES - Wagon Type Synonyms Dictionary

### Community 5 - "App Features"
Cohesion: 0.2
Nodes (14): RailMatch AI Agent Intelligent Suggestion Engine, Аналитика Market Analytics Feature, Demo Mode Guest Demo Access Mode, Birzha Freight Exchange Feature, Сообщения Messaging Chat Feature, Мои Ставки My Wagon Bids Feature, Мои Заявки My Freight Requests Feature, Exchange Screen Birzha Main Freight Exchange (+6 more)

### Community 6 - "Business Model and UX"
Cohesion: 0.22
Nodes (11): Anti-Leak Contact Detection System, Chat UX Dialog List Main Chat Area, Commission-Based Business Model 2.5%, Supabase DB Schema profiles requests bids messages wagons, 4-Stage Deal Pipeline, Fleet Dislocation Map Interactive Russia Map, RailMatch B2B Marketplace Platform, Tech Stack React 18 Vite Supabase Tailwind Telegram (+3 more)

### Community 7 - "Error Handling"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 8 - "Chat and Signing"
Cohesion: 0.4
Nodes (0): 

### Community 9 - "Terms and Legal"
Cohesion: 0.4
Nodes (0): 

### Community 10 - "Supabase Edge Functions"
Cohesion: 0.4
Nodes (0): 

### Community 11 - "Demo Flow Tests"
Cohesion: 0.6
Nodes (4): enter_demo(), log(), Railmatch Anti - Demo flow deep test Tests demo app: navigation, rating badges,, run()

### Community 12 - "Final Deploy Tests"
Cohesion: 0.6
Nodes (4): click_nav(), log(), Click nav tab by index: 0=BIRJA, 1=MY REQ, 2=MY BIDS, 3=ANALYTICS, 4=MESSAGES, run()

### Community 13 - "Core UI Screens"
Cohesion: 0.4
Nodes (5): LandingScreen, ProfileSettings, RequestCard, haptic utility, supabaseClient

### Community 14 - "Document Signing Flow"
Cohesion: 0.4
Nodes (5): Electronic Signature 63-FZ, Platform Commission 2.5%, DocumentGenerator, DocumentSigningModal, RobotoBase64 font

### Community 15 - "Profile View Monitor"
Cohesion: 0.67
Nodes (2): ProfileAccessGuard(), ProfileViewMonitor()

### Community 16 - "App Pre-deploy Tests"
Cohesion: 0.67
Nodes (3): log(), Railmatch Anti - Pre-deployment gap testing Tests all major user flows and surfa, run_tests()

### Community 17 - "Deep Pre-deploy Tests"
Cohesion: 0.67
Nodes (3): log(), Railmatch Anti - Deep pre-deploy gap testing Covers: landing → auth → demo app f, run()

### Community 18 - "AI Bids and Requests"
Cohesion: 0.67
Nodes (4): aiService (anti), MyBidsView (anti), MyRequestsView (anti), RequestCard (anti)

### Community 19 - "Chat Security Layer"
Cohesion: 0.5
Nodes (4): ChatWindow Component, 4-Level Anti-Leakage Security System, STOP_WORDS List, validateMessageIntent Function

### Community 20 - "NLP Parser Functions"
Cohesion: 0.5
Nodes (4): getClarificationQuestion Function, getMissingFields Function, parsePrompt Function, AiAgentBar Component

### Community 21 - "Profile Rate Limiting"
Cohesion: 0.67
Nodes (4): Daily Profile View Limit 50/day, Escrow-based contact unlock, ProfileViewMonitor, SecurityManager

### Community 22 - "Telegram Library"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Haptic Feedback"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Document Signing Modal"
Cohesion: 0.67
Nodes (3): DocumentGenerator (anti), DocumentSigningModal (anti), PLATFORM_COMMISSION_RATE constant

### Community 25 - "Exchange UX and Product"
Cohesion: 0.67
Nodes (3): AI Agent Bar for NLP Request Creation, Exchange Birzha UX Cargo Cards AI Bar Demo Banner, RailMatch Product Technical Specification MVP

### Community 26 - "Mobile Design"
Cohesion: 0.67
Nodes (3): Desktop Web Design Layout, Mobile Telegram Mini App Design Layout, Mobile View RailMatch Mobile App Telegram Mini App

### Community 27 - "Bot Start Handler"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Admin Panel"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Onboarding Modal"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Security Manager"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Mock Data Scripts"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Demo Data Reset"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "DB Insert Tests"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Owner Insert Tests"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Schema Inspector"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "REST API Tests"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Landing and Terms"
Cohesion: 1.0
Nodes (2): LandingScreen (anti), TermsModal (anti)

### Community 38 - "Profile and Security"
Cohesion: 1.0
Nodes (2): ProfileViewMonitor (anti), SecurityManager (anti)

### Community 39 - "Profile Settings"
Cohesion: 1.0
Nodes (2): ProfileSettings (anti), supabaseClient (anti)

### Community 40 - "Auth Screen"
Cohesion: 1.0
Nodes (2): AuthScreen Component, Supabase Client Singleton (anti)

### Community 41 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Utility"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Utility"
Cohesion: 1.0
Nodes (1): ErrorBoundary (anti)

### Community 51 - "Utility"
Cohesion: 1.0
Nodes (1): FleetDislocation (anti)

### Community 52 - "Utility"
Cohesion: 1.0
Nodes (1): OnboardingModal (anti)

### Community 53 - "Utility"
Cohesion: 1.0
Nodes (1): ProfileAccessGuard

### Community 54 - "Utility"
Cohesion: 1.0
Nodes (1): UserDashboard (anti)

### Community 55 - "Utility"
Cohesion: 1.0
Nodes (1): constants (anti)

### Community 56 - "Utility"
Cohesion: 1.0
Nodes (1): Supabase Database

### Community 57 - "Utility"
Cohesion: 1.0
Nodes (1): Heuristic NLP Parser (RailMatch)

### Community 58 - "Utility"
Cohesion: 1.0
Nodes (1): PLATFORM_COMMISSION_RATE Constant

### Community 59 - "Utility"
Cohesion: 1.0
Nodes (1): MAX_COMMISSION_ROUNDS Constant

### Community 60 - "Utility"
Cohesion: 1.0
Nodes (1): Violation Threshold Constants

### Community 61 - "Utility"
Cohesion: 1.0
Nodes (1): AnalyticsDashboard Component

### Community 62 - "Utility"
Cohesion: 1.0
Nodes (1): BidModal Component

### Community 63 - "Utility"
Cohesion: 1.0
Nodes (1): CreateRequestForm Component

### Community 64 - "Utility"
Cohesion: 1.0
Nodes (1): DemoModal

### Community 65 - "Utility"
Cohesion: 1.0
Nodes (1): ErrorBoundary

### Community 66 - "Utility"
Cohesion: 1.0
Nodes (1): FleetDislocation

### Community 67 - "Utility"
Cohesion: 1.0
Nodes (1): TermsModal

### Community 68 - "Utility"
Cohesion: 1.0
Nodes (1): constants (PLATFORM_COMMISSION_RATE)

### Community 69 - "Utility"
Cohesion: 1.0
Nodes (1): PLATFORM_COMMISSION_RATE 2.5%

### Community 70 - "Utility"
Cohesion: 1.0
Nodes (1): supabase - Supabase Client Instance

### Community 71 - "Utility"
Cohesion: 1.0
Nodes (1): test_app - Pre-deployment Gap Testing

### Community 72 - "Utility"
Cohesion: 1.0
Nodes (1): test_deep - Deep Pre-deploy Gap Testing

### Community 73 - "Utility"
Cohesion: 1.0
Nodes (1): test_demo - Demo Flow Deep Test

### Community 74 - "Utility"
Cohesion: 1.0
Nodes (1): test_final - Final Pre-deploy Verification

### Community 75 - "Utility"
Cohesion: 1.0
Nodes (1): RailMatch Project Claude Configuration

### Community 76 - "Utility"
Cohesion: 1.0
Nodes (1): Landing Page UX Hero Dual Role Value Prop

### Community 77 - "Utility"
Cohesion: 1.0
Nodes (1): Auth UX Email Password Login with Validation States

### Community 78 - "Utility"
Cohesion: 1.0
Nodes (1): Analytics UX KPI Widgets Bid Dynamics Chart

### Community 79 - "Utility"
Cohesion: 1.0
Nodes (1): Exchange Screen No Form Биржа Without Filter Form

## Knowledge Gaps
- **83 isolated node(s):** `Railmatch Anti - Pre-deployment gap testing Tests all major user flows and surfa`, `Railmatch Anti - Deep pre-deploy gap testing Covers: landing → auth → demo app f`, `Railmatch Anti - Demo flow deep test Tests demo app: navigation, rating badges,`, `Click nav tab by index: 0=BIRJA, 1=MY REQ, 2=MY BIDS, 3=ANALYTICS, 4=MESSAGES`, `ErrorBoundary (anti)` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Bot Start Handler`** (2 nodes): `startHandler.js`, `handleStart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Panel`** (2 nodes): `AdminPanel.jsx`, `AdminPanel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Modal`** (2 nodes): `OnboardingModal.jsx`, `OnboardingModal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Security Manager`** (2 nodes): `SecurityManager.jsx`, `SecurityManager()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mock Data Scripts`** (2 nodes): `insertMockData.js`, `insertMockData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Demo Data Reset`** (2 nodes): `resetDemoData.js`, `resetDemoData()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DB Insert Tests`** (2 nodes): `testInsert.js`, `testInsert()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Owner Insert Tests`** (2 nodes): `testInsertOwner.js`, `test()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Inspector`** (2 nodes): `testMeta.js`, `testFetch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `REST API Tests`** (2 nodes): `testRest.js`, `testFetch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Landing and Terms`** (2 nodes): `LandingScreen (anti)`, `TermsModal (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile and Security`** (2 nodes): `ProfileViewMonitor (anti)`, `SecurityManager (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile Settings`** (2 nodes): `ProfileSettings (anti)`, `supabaseClient (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Screen`** (2 nodes): `AuthScreen Component`, `Supabase Client Singleton (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `generateMap.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `testParser.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `testParserHyphen.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `constants.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `find_buttons.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `ErrorBoundary (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `FleetDislocation (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `OnboardingModal (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `ProfileAccessGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `UserDashboard (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `constants (anti)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Supabase Database`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Heuristic NLP Parser (RailMatch)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `PLATFORM_COMMISSION_RATE Constant`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `MAX_COMMISSION_ROUNDS Constant`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Violation Threshold Constants`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `AnalyticsDashboard Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `BidModal Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `CreateRequestForm Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `DemoModal`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `ErrorBoundary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `FleetDislocation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `TermsModal`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `constants (PLATFORM_COMMISSION_RATE)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `PLATFORM_COMMISSION_RATE 2.5%`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `supabase - Supabase Client Instance`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `test_app - Pre-deployment Gap Testing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `test_deep - Deep Pre-deploy Gap Testing`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `test_demo - Demo Flow Deep Test`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `test_final - Final Pre-deploy Verification`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `RailMatch Project Claude Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Landing Page UX Hero Dual Role Value Prop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Auth UX Email Password Login with Validation States`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Analytics UX KPI Widgets Bid Dynamics Chart`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility`** (1 nodes): `Exchange Screen No Form Биржа Without Filter Form`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProfileSettings` connect `Core UI Screens` to `Telegram Backend and DB`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `Railmatch Anti - Pre-deployment gap testing Tests all major user flows and surfa`, `Railmatch Anti - Deep pre-deploy gap testing Covers: landing → auth → demo app f`, `Railmatch Anti - Demo flow deep test Tests demo app: navigation, rating badges,` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Telegram Backend and DB` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `React UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._