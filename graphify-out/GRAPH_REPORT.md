# Graph Report - /Users/joel/projetos/atendente  (2026-06-26)

## Corpus Check
- 129 files · ~64,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 732 nodes · 1316 edges · 67 communities (43 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Agenda & Appointment UI|Agenda & Appointment UI]]
- [[_COMMUNITY_Server Backend Core|Server Backend Core]]
- [[_COMMUNITY_AI Message Processing|AI Message Processing]]
- [[_COMMUNITY_Frontend Package Config|Frontend Package Config]]
- [[_COMMUNITY_Dashboard & Settings UI|Dashboard & Settings UI]]
- [[_COMMUNITY_Backend Package Config|Backend Package Config]]
- [[_COMMUNITY_Support & FAQ System|Support & FAQ System]]
- [[_COMMUNITY_Auth & Account Context|Auth & Account Context]]
- [[_COMMUNITY_App Shell & Routing|App Shell & Routing]]
- [[_COMMUNITY_Root TypeScript Config|Root TypeScript Config]]
- [[_COMMUNITY_App TypeScript Config|App TypeScript Config]]
- [[_COMMUNITY_Landing Page UI|Landing Page UI]]
- [[_COMMUNITY_shadcnui Config|shadcn/ui Config]]
- [[_COMMUNITY_Conversations & WhatsApp|Conversations & WhatsApp]]
- [[_COMMUNITY_Infrastructure & DevOps|Infrastructure & DevOps]]
- [[_COMMUNITY_Server QueryBuilder DB|Server QueryBuilder DB]]
- [[_COMMUNITY_Server TypeScript Config|Server TypeScript Config]]
- [[_COMMUNITY_Onboarding & Form Config|Onboarding & Form Config]]
- [[_COMMUNITY_Node TypeScript Config|Node TypeScript Config]]
- [[_COMMUNITY_System Architecture Docs|System Architecture Docs]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 66|Community 66]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 32 edges
2. `Button` - 22 edges
3. `useAccount()` - 21 edges
4. `db` - 19 edges
5. `compilerOptions` - 19 edges
6. `processWithAi()` - 18 edges
7. `compilerOptions` - 18 edges
8. `QueryBuilder` - 17 edges
9. `useAuth()` - 17 edges
10. `handleIncomingMessage()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Express Backend (port 5003)` ----> `Lembrete (Reminder) Service`  [EXTRACTED]
  docs/documentacao-tecnica.md → server/src/services/lembrete.ts
- `Configuracoes (Settings) Page` ----> `Travel Time Configuration`  [EXTRACTED]
  src/pages/dashboard/Configuracoes.tsx → PRODUCT.md
- `MessageHandler` ----> `Double-Check Security`  [EXTRACTED]
  server/src/services/messageHandler/index.ts → docs/documentacao-tecnica.md
- `AuthContext` ----> `SSO Auth Flow (Controle Total)`  [EXTRACTED]
  src/contexts/AuthContext.tsx → docs/documentacao-tecnica.md
- `Evolution API` ----> `Webhook Routes`  [EXTRACTED]
  docker-compose.yml → server/src/routes/webhook.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Deployment Architecture** —  [INFERRED]
- **AI Integration Stack** —  [INFERRED]
- **WhatsApp Connectivity Stack** —  [INFERRED]
- **Automatic Scheduling System** —  [INFERRED]
- **Security & Compliance Stack** —  [INFERRED]
- **Analytics & Monitoring Stack** —  [INFERRED]
- **Customer Management Stack** —  [INFERRED]
- **Authentication System** —  [INFERRED]
- **Frontend Pages** —  [INFERRED]
- **Backend API Routes** —  [INFERRED]
- **Backend Services Layer** —  [INFERRED]
- **Database Schema** —  [INFERRED]
- **Onboarding Wizard Flow** —  [INFERRED]
- **External Integrations** —  [INFERRED]
- **Product Tier Features** —  [INFERRED]
- **Brand & Design System** —  [INFERRED]
- **End-to-End Message Pipeline** —  [INFERRED]

## Communities (67 total, 24 thin omitted)

### Community 0 - "Agenda & Appointment UI"
Cohesion: 0.06
Nodes (39): Props, Props, HOURS, Props, Props, MiniCalendar(), Props, HOURS (+31 more)

### Community 1 - "Server Backend Core"
Cohesion: 0.08
Nodes (41): db, pool, QueryFilter, connectInstance(), createInstance(), disconnectInstance(), downloadMedia(), EvolutionInstance (+33 more)

### Community 2 - "AI Message Processing"
Cohesion: 0.12
Nodes (40): buildSystemPrompt(), BusinessHours, genAI, generateResponse(), IaConfig, ProductTier, ServicoCatalogo, criarAgendamentoComMatch() (+32 more)

### Community 3 - "Frontend Package Config"
Cohesion: 0.05
Nodes (43): dependencies, class-variance-authority, clsx, date-fns, @hookform/resolvers, lucide-react, @radix-ui/react-accordion, @radix-ui/react-avatar (+35 more)

### Community 4 - "Dashboard & Settings UI"
Cohesion: 0.18
Nodes (19): AgendaIntegracoesSection(), PALETTE_COLORS, PROVIDER_INFO, DIAS, Instance, NAV_ITEMS, SettingsNavItem, DashboardStatus (+11 more)

### Community 5 - "Backend Package Config"
Cohesion: 0.07
Nodes (28): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, @google/generative-ai, helmet (+20 more)

### Community 6 - "Support & FAQ System"
Cohesion: 0.12
Nodes (18): categorias, Suporte(), categorias, faqs, getCategoriaIcon(), Modulo, modulos, FAQContentRenderer() (+10 more)

### Community 7 - "Auth & Account Context"
Cohesion: 0.13
Nodes (19): AI Autonomy Levels, Header(), Props, ProtectedRoute(), HorariosConfig(), IaConfig, InstanciasConfig(), AccountContext (+11 more)

### Community 8 - "App Shell & Routing"
Cohesion: 0.11
Nodes (14): AppLayout(), Props, allRoutes, Sidebar(), AuthContextValue, AuthProvider(), Session, User (+6 more)

### Community 9 - "Root TypeScript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, ignoreDeprecations, isolatedModules, jsx, lib, module (+13 more)

### Community 10 - "App TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 11 - "Landing Page UI"
Cohesion: 0.10
Nodes (13): ChatMessage, CHATS, SCREENS, avatarColors, avatarLetters, baseWidths, days, depthScales (+5 more)

### Community 12 - "shadcn/ui Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 13 - "Conversations & WhatsApp"
Cohesion: 0.17
Nodes (9): Conversas(), Conversation, Message, authListeners, db, useWhatsAppConnection(), Props, StepSeguranca() (+1 more)

### Community 14 - "Infrastructure & DevOps"
Cohesion: 0.13
Nodes (17): leads table, message_queue table, orcamentos table, Deploy Script (deploy.sh), Evolution API Client, Express Backend (port 5003), Lead Qualification, LeadQualificator Service (+9 more)

### Community 16 - "Server TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir (+8 more)

### Community 17 - "Onboarding & Form Config"
Cohesion: 0.24
Nodes (9): CatalogoConfig(), Servico, Props, StepAssistente(), Props, Input, Label, labelVariants (+1 more)

### Community 18 - "Node TypeScript Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 19 - "System Architecture Docs"
Cohesion: 0.18
Nodes (14): Atendente, Controle Total ERP, clientes table, Docker Compose, Evolution API, Impeccable UI Design Skill, PostgreSQL 16, Target Users: Self-Employed Service Providers (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (12): MessageHandler Agendamento Submodule, MessageHandler AI Submodule, AI Message Processing Pipeline, Automatic Appointment Scheduling, BAD_PATTERNS History Filter, MessageHandler Media Submodule, MessageHandler Client Submodule, MessageHandler DB Submodule (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): Agenda (Calendar) Page, Apple Maps Navigation, AppointmentSheet, DayCarousel, DayTimeline, Editable Agenda, Google Maps Navigation, MonthTimeline (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (9): Analytics Dashboard, Analytics Page, App Route Structure, Auth Page, Dashboard Cache Strategy, Dashboard Page, Dashboard Routes, Landing/Index Page (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.28
Nodes (5): CATEGORIA_ICONE, stepsLabel, formatPhoneBR(), RAMOS, Props

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (8): Agenda Routes, agendamentos table, business_hours table, ia_configs table, servicos_catalogo table, Lembrete (Reminder) Service, Automatic Scheduling Flow, Travel Time Configuration

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (8): AI Resolution Metric (ai_resolved), Analytics Routes, Block Contacts from AI, Conversas (Chat) Page, conversations table, Human Intervention via WhatsApp, Messages Routes, Visual Message Labels

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (8): Content Moderation Pipeline, Double-Check Security, Gemini API Client, Gemini Model Fallback Chain, Google Gemini AI, Gravel Content Compliance, Moderation Library, Prompt Engineering Strategy

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (7): EXEMPLO_SERVICO_POR_RAMO, getRamoById(), getUnidadesPorRamo(), Ramo, RamoPerfil, UnidadeMedida, UNIDADES_POR_PERFIL

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): AgendaIntegracoesSection, Business Hours Configuration, CatalogoConfig, Configuracoes (Settings) Page, HorariosConfig, InstanciasConfig, Lite Service Catalog

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (7): Auth Routes, AuthContext, Generic Data Routes, Instances Routes, JWT Auth Middleware, Local Auth Flow (Direct Login), Webhook Routes

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): Onboarding Wizard, Onboarding: StepAssistente, Onboarding: StepConexao, Onboarding: StepNegocio, Onboarding: StepSeguranca, Onboarding: StepSobreVoce, QR Code WhatsApp Connection

### Community 33 - "Community 33"
Cohesion: 0.38
Nodes (6): getSupabaseRowCount(), getVpsRowCount(), run(), supabase, TABLES, vpsConfig

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): CalendarIntegration, CalendarPreferences, CalendarProvider, DEFAULT_PREFS, STORAGE_KEYS

### Community 35 - "Community 35"
Cohesion: 0.47
Nodes (5): getRowCount(), getTables(), run(), supabaseConfig, vpsConfig

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (5): FAQCategoryNav, FAQList, ModulesGrid, Suporte (Support) Page, SupportChannels

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (4): AppLayout, BottomNav, Header, Sidebar

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (3): VITE_API_BASE_URL, VITE_API_URL, deploy.sh script

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (3): Clear Cache Utility Page, Main Landing HTML, Sora Font

## Knowledge Gaps
- **331 isolated node(s):** `start-backend.sh script`, `$schema`, `style`, `rsc`, `tsx` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hasProduct()` connect `Server Backend Core` to `Auth & Account Context`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `ProtectedRoute()` connect `Auth & Account Context` to `App Shell & Routing`, `Server Backend Core`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `IaConfig` connect `Auth & Account Context` to `Onboarding & Form Config`, `Community 30`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `start-backend.sh script`, `$schema`, `style` to the rest of the system?**
  _331 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agenda & Appointment UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Server Backend Core` be split into smaller, more focused modules?**
  _Cohesion score 0.0819252432155658 - nodes in this community are weakly interconnected._
- **Should `AI Message Processing` be split into smaller, more focused modules?**
  _Cohesion score 0.12270531400966184 - nodes in this community are weakly interconnected._