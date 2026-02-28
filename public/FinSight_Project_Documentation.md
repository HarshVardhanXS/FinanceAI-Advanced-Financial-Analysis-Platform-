# FinSight — Complete Project Documentation

**Project:** FinSight — Smart Market Intelligence  
**Author:** HarshVardhanXS  
**Tech Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase · Deno Edge Functions  
**Live URL:** https://trend-bard.lovable.app

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Technology Stack Breakdown](#3-technology-stack-breakdown)
4. [Directory Structure](#4-directory-structure)
5. [Authentication & Security](#5-authentication--security)
6. [Database Schema & Tables](#6-database-schema--tables)
7. [Backend Edge Functions](#7-backend-edge-functions)
8. [Frontend Pages](#8-frontend-pages)
9. [UI Components](#9-ui-components)
10. [AI/ML Components](#10-aiml-components)
11. [Custom Hooks](#11-custom-hooks)
12. [External APIs & Integrations](#12-external-apis--integrations)
13. [Design System](#13-design-system)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Deployment & Configuration](#15-deployment--configuration)

---

## 1. Project Overview

FinSight is a modern, full-stack financial analytics platform that empowers users to:

- **Track global stocks** across 12+ international exchanges in real-time
- **Get AI-powered insights** using Gemini 2.5 Flash (sentiment analysis, price predictions, technical analysis)
- **Manage portfolios & watchlists** with persistent cloud-backed storage
- **Generate professional PDF reports** with comprehensive stock analysis
- **Chat with a finance AI chatbot** for investment education and analysis
- **Perform ML model training** with dataset upload, configuration, and analytics
- **Trade options** (paper trading) with Greeks visualization
- **Set price alerts** and receive in-app notifications
- **Administer users** with role-based access control (Admin/Premium/Free tiers)

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │  Pages   │ │Components│ │  Hooks   │ │  UI Library  │    │
│  │ (Router) │ │(Dashboard│ │(useUser  │ │  (shadcn/ui) │    │
│  │          │ │  AI, ML) │ │ Role etc)│ │              │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────┘    │
│       │             │            │                            │
│       └─────────────┴────────────┘                            │
│                      │                                        │
│              Supabase JS Client                               │
│         (supabase.auth / supabase.from / supabase.functions)  │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┴───────────────────────────────────────┐
│                    BACKEND (Supabase / Lovable Cloud)         │
│                                                               │
│  ┌─────────────────┐    ┌──────────────────────────────┐     │
│  │  PostgreSQL DB   │    │    Deno Edge Functions (11)  │     │
│  │  (13 tables)     │    │  ┌─────────────────────────┐ │     │
│  │  + RLS Policies  │    │  │ fetch-stock-data        │ │     │
│  │  + DB Functions  │    │  │ search-stocks           │ │     │
│  │  + Triggers      │    │  │ fetch-stock-symbols     │ │     │
│  └─────────────────┘    │  │ fetch-stock-details     │ │     │
│                          │  │ fetch-options           │ │     │
│  ┌─────────────────┐    │  │ analyze-stock (AI)      │ │     │
│  │  Auth Service    │    │  │ sentiment-analysis (AI) │ │     │
│  │  (JWT sessions)  │    │  │ technical-analysis (AI) │ │     │
│  └─────────────────┘    │  │ price-prediction (AI)   │ │     │
│                          │  │ finance-chat (AI+Stream)│ │     │
│                          │  │ generate-report (AI)    │ │     │
│                          │  └─────────────────────────┘ │     │
│                          └──────────────────────────────┘     │
│                                    │                          │
│                          ┌─────────┴──────────┐              │
│                          │  External APIs      │              │
│                          │  • Finnhub (stocks) │              │
│                          │  • Lovable AI GW    │              │
│                          │    (Gemini 2.5)     │              │
│                          └────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Breakdown

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 18 + TypeScript | Component-based reactive UI with type safety |
| **Build Tool** | Vite | Fast HMR dev server, optimized production builds |
| **Styling** | Tailwind CSS + CSS Variables | Utility-first CSS with HSL-based design tokens |
| **Component Library** | shadcn/ui + Radix UI | 50+ accessible, themeable UI primitives |
| **Charts** | Recharts | Line charts, area charts for stock data visualization |
| **Maps** | react-simple-maps | Interactive world map for global stock exchange display |
| **Animations** | Framer Motion | Page transitions, hover effects, marker animations |
| **PDF Generation** | jsPDF | Client-side PDF report creation and download |
| **CSV Parsing** | PapaParse | Dataset upload and parsing for ML training module |
| **Routing** | React Router v6 | Client-side routing with nested routes |
| **State Management** | React Query (TanStack) | Server state caching, background refetching |
| **Form Validation** | React Hook Form + Zod | Schema-based form validation |
| **Backend** | Supabase (Lovable Cloud) | PostgreSQL database, Auth, Edge Functions |
| **Edge Runtime** | Deno | Serverless functions for API proxying and AI calls |
| **AI Model** | Google Gemini 2.5 Flash | Sentiment analysis, predictions, chat, reports |
| **Stock Data API** | Finnhub | Real-time quotes, candle data, company news, technical indicators |

---

## 4. Directory Structure

```
finsight/
├── public/
│   ├── favicon.ico                    # App icon
│   ├── placeholder.svg                # Placeholder image
│   └── robots.txt                     # SEO crawl rules
│
├── src/
│   ├── assets/
│   │   └── logo.png                   # College/project logo
│   │
│   ├── components/
│   │   ├── ui/                        # 50+ shadcn/ui primitives (Button, Card, Dialog, etc.)
│   │   ├── dashboard/                 # Dashboard-specific components
│   │   │   ├── DashboardHeader.tsx     # Top navbar with search, auth, theme toggle
│   │   │   ├── MarketOverview.tsx      # S&P 500, DOW, NASDAQ cards
│   │   │   ├── StockGrid.tsx          # Watchlist with mini-charts
│   │   │   ├── StockWorldMap.tsx       # Interactive global stock map
│   │   │   ├── AIInsights.tsx          # AI-powered stock analysis panel
│   │   │   └── ReportGenerator.tsx     # PDF report generation
│   │   ├── ai/                        # AI Analysis Hub components
│   │   │   ├── FinanceChatbot.tsx      # Streaming AI chat interface
│   │   │   ├── SentimentAnalysis.tsx   # Market sentiment visualization
│   │   │   ├── PricePrediction.tsx     # AI price target predictions
│   │   │   └── TechnicalAnalysis.tsx   # Technical indicators dashboard
│   │   ├── ml/                        # Machine Learning training components
│   │   │   ├── DatasetUpload.tsx       # CSV/file upload for training data
│   │   │   ├── TrainingConfig.tsx      # Model hyperparameter configuration
│   │   │   ├── TrainingProgress.tsx    # Real-time training progress bar
│   │   │   ├── ModelAnalytics.tsx      # Model performance metrics
│   │   │   ├── ConfusionMatrix.tsx     # Classification results matrix
│   │   │   ├── CorrelationHeatmap.tsx  # Feature correlation visualization
│   │   │   └── ReportsPanel.tsx        # Training run reports
│   │   ├── options/                   # Options trading components
│   │   │   ├── OptionsChain.tsx        # Options chain table (calls/puts)
│   │   │   ├── OptionsPositions.tsx    # Open positions tracker
│   │   │   └── OptionsTradeDialog.tsx  # Trade execution modal
│   │   ├── AppSidebar.tsx             # Navigation sidebar
│   │   ├── AuthDialog.tsx             # Modal sign-in form
│   │   ├── NotificationCenter.tsx     # Bell icon + notification dropdown
│   │   ├── Portfolio.tsx              # Portfolio holdings display
│   │   ├── PriceAlerts.tsx            # Price alert management
│   │   ├── StockSearch.tsx            # Header search bar (Finnhub search)
│   │   ├── SubscriptionBadge.tsx      # User tier badge (Free/Premium/Admin)
│   │   ├── ThemeToggle.tsx            # Dark/light mode toggle
│   │   ├── TradingHistory.tsx         # Past trades table
│   │   ├── UpgradePrompt.tsx          # Premium upsell card
│   │   ├── Watchlist.tsx              # Watchlist management component
│   │   └── Watermark.tsx              # Background finance icons + attribution
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx             # Responsive breakpoint detection
│   │   ├── use-toast.ts               # Toast notification hook
│   │   ├── useMLTraining.tsx           # ML training state machine hook
│   │   ├── useTokenRefresh.tsx         # JWT auto-refresh on interval
│   │   └── useUserRole.tsx             # Fetches user role from DB (admin/premium/free)
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts                  # Auto-generated Supabase client instance
│   │   └── types.ts                   # Auto-generated TypeScript types from DB schema
│   │
│   ├── pages/
│   │   ├── Index.tsx                  # Main dashboard (home page)
│   │   ├── Auth.tsx                   # Login/signup page
│   │   ├── Admin.tsx                  # Admin panel (user role management)
│   │   ├── AIAnalysis.tsx             # AI Analysis Hub page
│   │   ├── MLTraining.tsx             # ML model training page
│   │   ├── StockBrowser.tsx           # Global stock browser with exchange tabs
│   │   ├── StockDetail.tsx            # Individual stock detail page
│   │   ├── OptionsTrading.tsx         # Options trading interface
│   │   ├── PortfolioPage.tsx          # Portfolio management page
│   │   ├── WatchlistPage.tsx          # Full watchlist page
│   │   ├── AnalyticsPage.tsx          # Analytics dashboard page
│   │   ├── AlertsPage.tsx             # Price alerts management page
│   │   └── NotFound.tsx               # 404 error page
│   │
│   ├── types/
│   │   └── ml-training.ts             # TypeScript types for ML training module
│   │
│   ├── lib/utils.ts                   # Tailwind merge utility (cn function)
│   ├── App.tsx                        # Root component with routing
│   ├── App.css                        # Global animations and styles
│   ├── index.css                      # CSS custom properties (design tokens)
│   └── main.tsx                       # Vite entry point
│
├── supabase/
│   ├── config.toml                    # Supabase project configuration
│   ├── migrations/                    # SQL migration files (auto-managed)
│   └── functions/                     # 11 Deno Edge Functions
│       ├── fetch-stock-data/          # Real-time stock quotes (Finnhub)
│       ├── fetch-stock-details/       # Detailed stock information
│       ├── fetch-stock-symbols/       # Stock symbols by exchange
│       ├── search-stocks/             # Stock search (Finnhub symbol lookup)
│       ├── fetch-options/             # Options chain data
│       ├── analyze-stock/             # AI stock analysis (Gemini)
│       ├── sentiment-analysis/        # AI sentiment scoring (Gemini)
│       ├── technical-analysis/        # AI technical indicators (Gemini)
│       ├── price-prediction/          # AI price prediction (Gemini)
│       ├── finance-chat/              # AI chatbot with streaming (Gemini)
│       └── generate-report/           # AI PDF report generation (Gemini)
│
├── index.html                         # HTML entry with meta/OG tags
├── package.json                       # Dependencies and scripts
├── tailwind.config.ts                 # Tailwind theme configuration
├── vite.config.ts                     # Vite build configuration
├── tsconfig.json                      # TypeScript configuration
└── eslint.config.js                   # Linting rules
```

---

## 5. Authentication & Security

### Authentication Flow

1. **Sign Up** (`src/pages/Auth.tsx`):
   - User enters email + password (min 8 chars, must include uppercase, lowercase, number)
   - Calls `supabase.auth.signUp()` with email redirect URL
   - User receives confirmation email before account is active
   - On success, a `profiles` row and `user_roles` row (default: "free") are created via database triggers

2. **Sign In** (`src/pages/Auth.tsx`):
   - Calls `supabase.auth.signInWithPassword()`
   - Returns a JWT session token stored in `localStorage`
   - `onAuthStateChange` listener redirects to dashboard

3. **Session Management** (`src/hooks/useTokenRefresh.tsx`):
   - Auto-refreshes JWT tokens on a periodic interval
   - Prevents 401 errors during long sessions
   - Every edge function explicitly extracts the Bearer token and passes it to `getUser(token)` for proper validation

4. **Sign Out** (`src/components/dashboard/DashboardHeader.tsx`):
   - Calls `supabase.auth.signOut()`
   - Clears session and redirects to home

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|-------------|
| **free** | Default tier. Access to dashboard, watchlist, basic features |
| **premium** | All free features + advanced AI analysis, unlimited reports |
| **admin** | Full access + Admin Panel for user role management |

- Roles stored in `user_roles` table with RLS policies
- `useUserRole()` hook fetches current user's role
- Admin panel (`/admin`) restricted — redirects non-admins
- `hasAccess(requiredRole)` utility for feature gating

### Security Measures

- **Row Level Security (RLS)**: All 13 tables have RLS enabled with policies ensuring users can only access their own data
- **Input Validation**: All edge functions use Zod schemas to validate incoming request bodies
- **Rate Limiting**: Database-backed rate limiting per user per endpoint (configurable limits)
- **CORS Headers**: All edge functions include proper CORS configuration
- **Token Validation**: Every authenticated endpoint explicitly validates the JWT token

---

## 6. Database Schema & Tables

### Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **profiles** | User profile data | `id` (UUID, FK to auth.users), `email`, `full_name` |
| **user_roles** | RBAC tier assignments | `user_id`, `role` (enum: admin/premium/free) |
| **user_settings** | User preferences | `user_id`, `theme`, `notifications_enabled`, `virtual_cash` |
| **watchlists** | Saved stock watchlists | `user_id`, `symbol`, `name` |
| **portfolios** | Stock holdings | `user_id`, `symbol`, `quantity`, `average_price` |
| **transactions** | Buy/sell trade history | `user_id`, `symbol`, `quantity`, `price`, `transaction_type` |
| **paper_trades** | Virtual/simulated trades | `user_id`, `symbol`, `quantity`, `price`, `trade_type` |
| **price_alerts** | Alert configurations | `user_id`, `symbol`, `target_price`, `alert_type`, `is_active` |
| **notifications** | In-app notifications | `user_id`, `title`, `message`, `type`, `is_read` |
| **stocks_browser** | Cached stock metadata | `symbol`, `name`, `exchange`, `country`, `currency` |
| **options_contracts** | Available options contracts | `underlying_symbol`, `strike_price`, `expiration_date`, Greeks |
| **options_trades** | Options trade history | `user_id`, `contract_symbol`, `contracts`, `premium`, `status` |
| **rate_limits** | API rate limiting tracker | `identifier`, `endpoint`, `request_count`, `window_start` |

### Database Functions

| Function | Purpose |
|----------|---------|
| `check_rate_limit(p_endpoint, p_identifier, p_max_requests, p_window_seconds)` | Sliding-window rate limiter; returns boolean |
| `cleanup_rate_limits()` | Removes expired rate limit records |
| `get_user_role(_user_id)` | Returns the role enum for a given user |
| `has_role(_role, _user_id)` | Checks if a user has a specific role |

---

## 7. Backend Edge Functions

All edge functions are written in **Deno/TypeScript**, deployed as serverless functions, and follow a consistent pattern:

### Common Pattern (All Functions)
```
1. CORS preflight handling (OPTIONS)
2. JWT authentication (extract Bearer token → getUser(token))
3. Rate limiting (check_rate_limit RPC call)
4. Input validation (Zod schema)
5. Business logic (API call or AI inference)
6. JSON response with proper headers
```

### Function Details

#### `fetch-stock-data` — Real-Time Stock Quotes
- **Endpoint**: Invoked via `supabase.functions.invoke('fetch-stock-data', { body: { symbol } })`
- **External API**: Finnhub `/api/v1/quote` + `/api/v1/stock/candle`
- **Rate Limit**: 100 requests/minute per user
- **Returns**: `{ symbol, name, price, change, changePercent, isPositive, chartData[], isDemo }`
- **Fallback**: Returns mock/demo data if Finnhub API errors or returns empty data
- **Used by**: MarketOverview, StockGrid, StockWorldMap, AIInsights, Index page

#### `search-stocks` — Stock Symbol Search
- **Input**: `{ query: string }`
- **External API**: Finnhub `/api/v1/search`
- **Returns**: `{ stocks: Array<{ symbol, name, exchange, ... }> }`
- **Used by**: StockSearch component (header search bar)

#### `fetch-stock-symbols` — Exchange Stock Listings
- **Input**: `{ exchange: string }` (e.g., "US", "NS", "L")
- **External API**: Finnhub `/api/v1/stock/symbol`
- **Returns**: List of all stocks on the specified exchange
- **Used by**: StockBrowser page (exchange tabs)

#### `fetch-stock-details` — Detailed Stock Info
- **Input**: `{ symbol: string }`
- **External API**: Finnhub company profile + quote
- **Returns**: Company profile, financials, current price data
- **Used by**: StockDetail page

#### `fetch-options` — Options Chain Data
- **Input**: `{ symbol: string }`
- **Returns**: Options contracts with strikes, expirations, Greeks
- **Used by**: OptionsTrading page

#### `analyze-stock` — AI Stock Analysis
- **Input**: `{ symbol, marketContext?, requestType? }`
- **AI Model**: Gemini 2.5 Flash via Lovable AI Gateway
- **Process**: 
  1. Fetches real-time quote from Finnhub
  2. Combines with market context from dashboard
  3. Sends to AI for analysis
- **Rate Limit**: 20 requests/minute
- **Returns**: `{ analysis: string }` — natural language analysis
- **Used by**: AIInsights component

#### `sentiment-analysis` — Market Sentiment Scoring
- **Input**: `{ symbol: string }`
- **Process**:
  1. Fetches last 7 days of company news from Finnhub
  2. Feeds headlines + symbol to Gemini for structured sentiment
- **Rate Limit**: 20 requests/minute
- **Returns**: Structured JSON with `overallSentiment`, `sentimentScore` (-100 to 100), `confidence`, `factors[]`, `socialMentions`, `newsImpact`
- **Used by**: SentimentAnalysis component

#### `technical-analysis` — Technical Indicators
- **Input**: `{ symbol: string }`
- **Process**:
  1. Fetches quote + technical indicators from Finnhub
  2. AI generates structured analysis (RSI, MACD, Bollinger Bands, moving averages, patterns, support/resistance)
- **Rate Limit**: 20 requests/minute
- **Returns**: Structured JSON with `trend`, `indicators` (RSI, MACD, MAs, Bollinger), `patterns[]`, `supportResistance`, `volume`, `recommendation`, `signals`
- **Used by**: TechnicalAnalysis component

#### `price-prediction` — AI Price Predictions
- **Input**: `{ symbol, timeframe: '1d'|'1w'|'1m'|'3m' }`
- **Process**:
  1. Fetches current stock data from Finnhub
  2. AI generates price targets with confidence intervals
- **Rate Limit**: 15 requests/minute
- **Returns**: `{ prediction: { currentPrice, predictedPrice, priceTarget: {low, mid, high}, confidence, direction, keyFactors[], riskLevel, reasoning } }`
- **Used by**: PricePrediction component

#### `finance-chat` — AI Finance Chatbot (Streaming)
- **Input**: `{ messages: Array<{role, content}> }` — conversation history
- **AI Model**: Gemini 2.5 Flash with **streaming enabled**
- **System Prompt**: Expert financial advisor covering stocks, portfolio, technical analysis, options, risk management
- **Rate Limit**: 30 requests/minute
- **Returns**: Server-Sent Events (SSE) stream — `text/event-stream`
- **Used by**: FinanceChatbot component

#### `generate-report` — Professional PDF Report Generation
- **Input**: `{ symbol, marketContext?, includeMarketData? }`
- **AI Model**: Gemini 2.5 Flash
- **System Prompt**: Senior financial analyst at a top investment bank
- **Sections generated**: Executive Summary, Market Context, Technical Analysis, Fundamental Overview, Risk Assessment, Investment Recommendation
- **Rate Limit**: 10 requests/minute
- **Returns**: `{ report: string }` — full text report (client converts to PDF using jsPDF)
- **Used by**: ReportGenerator component

---

## 8. Frontend Pages

### `/` — Dashboard (Index.tsx)
The main landing page after login. Orchestrates all dashboard widgets:
- **MarketOverview**: 3 cards showing S&P 500, DOW JONES, NASDAQ with real-time data (auto-refreshes every 60s)
- **StockWorldMap**: Interactive world map with 12 major global stocks as animated markers
- **StockGrid**: User's personal watchlist with mini line charts, add/remove stocks
- **ReportGenerator**: Generate and download AI-powered PDF reports
- **AIInsights**: AI analysis panel with bullish/bearish signals, per-stock analysis, batch analysis for entire watchlist

### `/auth` — Authentication (Auth.tsx)
Tabbed sign-in/sign-up form with client-side password validation. Displays college logo and project branding. Redirects to dashboard on successful auth.

### `/stocks` — Stock Browser (StockBrowser.tsx)
Browse stocks from 12 international exchanges (US, India NSE/BSE, Toronto, London, Frankfurt, Paris, Tokyo, Hong Kong, Shanghai, Switzerland, Amsterdam). Features:
- Exchange tab switcher with country flags
- Search bar (calls `search-stocks` edge function)
- Category filters: All, Top Gainers, Top Losers, Most Active
- Click any stock card to navigate to detail page

### `/stocks/:symbol` — Stock Detail (StockDetail.tsx)
Detailed view of a single stock with comprehensive data fetched from `fetch-stock-details`.

### `/ai` — AI Analysis Hub (AIAnalysis.tsx)
Dedicated AI analysis page with:
- Stock symbol search bar
- **FinanceChatbot**: Full-featured streaming chat interface
- **SentimentAnalysis**: Visual sentiment gauge with factors breakdown
- **PricePrediction**: Price target cards with confidence intervals
- **TechnicalAnalysis**: Indicators dashboard (RSI, MACD, Bollinger, etc.)

### `/ml-training` — ML Training Lab (MLTraining.tsx)
Machine learning model training interface:
- **DatasetUpload**: Upload CSV datasets for training
- **TrainingConfig**: Configure model type, hyperparameters (learning rate, epochs, batch size)
- **TrainingProgress**: Real-time progress bar during training
- **ModelAnalytics**: Performance metrics (accuracy, loss curves)
- **ConfusionMatrix**: Visual classification results
- **CorrelationHeatmap**: Feature correlation visualization
- **ReportsPanel**: Training run history and reports

### `/options` — Options Trading (OptionsTrading.tsx)
Options trading interface (admin-only):
- Options chain table with calls and puts
- Greeks display (delta, gamma, theta, vega)
- Trade execution dialog
- Open positions tracker

### `/portfolio` — Portfolio Management (PortfolioPage.tsx)
View and manage stock holdings with P&L tracking.

### `/watchlist` — Watchlist (WatchlistPage.tsx)
Full-page watchlist management with real-time price updates.

### `/analytics` — Analytics Dashboard (AnalyticsPage.tsx)
Advanced analytics and data visualization page.

### `/alerts` — Price Alerts (AlertsPage.tsx)
Create and manage price alerts with target prices and alert types.

### `/admin` — Admin Panel (Admin.tsx)
Admin-only page for user management:
- Lists all users with their emails, join dates, and current roles
- Role selector dropdown to change any user's tier (Free/Premium/Admin)
- Protected by `useUserRole()` check — non-admins are redirected

### `*` — 404 Not Found (NotFound.tsx)
Custom 404 error page for invalid routes.

---

## 9. UI Components

### Core Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| **AppSidebar** | `AppSidebar.tsx` | Left navigation sidebar with 8 main links + admin section. Collapsible, auto-collapses on mobile. Uses shadcn Sidebar primitives. |
| **DashboardHeader** | `dashboard/DashboardHeader.tsx` | Sticky top header bar. Contains: logo, "FinSight" branding, stock search bar, markets status badge, subscription badge, notification bell, theme toggle, admin button, sign in/out button. |
| **Watermark** | `Watermark.tsx` | Fixed background layer with repeating grid of finance-themed Lucide icons (DollarSign, TrendingUp, BarChart3, Landmark, PieChart, Banknote, LineChart, Gem). Attribution badge "by HarshVardhanXS" at bottom. |

### Interactive Components

| Component | File | Purpose |
|-----------|------|---------|
| **StockSearch** | `StockSearch.tsx` | Autocomplete search input in the header. Calls `search-stocks` edge function on submit. Navigates to stock detail on selection. |
| **AuthDialog** | `AuthDialog.tsx` | Modal dialog for quick sign-in without leaving current page. Alternative to full `/auth` page. |
| **NotificationCenter** | `NotificationCenter.tsx` | Bell icon dropdown showing in-app notifications. Reads from `notifications` table. Mark as read functionality. |
| **ThemeToggle** | `ThemeToggle.tsx` | Dark/light mode switcher using `next-themes`. |
| **SubscriptionBadge** | `SubscriptionBadge.tsx` | Displays user's current tier (Free/Premium/Admin) as a styled badge in the header. |
| **UpgradePrompt** | `UpgradePrompt.tsx` | Card prompting free users to upgrade to premium. |
| **Portfolio** | `Portfolio.tsx` | Displays user's stock holdings with quantities and average prices. CRUD operations against `portfolios` table. |
| **Watchlist** | `Watchlist.tsx` | Watchlist management with add/remove, reads from `watchlists` table. |
| **PriceAlerts** | `PriceAlerts.tsx` | Create/manage price alerts. Stores in `price_alerts` table. |
| **TradingHistory** | `TradingHistory.tsx` | Table of past trades from `transactions` and `paper_trades` tables. |

### shadcn/ui Components (50+ primitives)

Located in `src/components/ui/`. These are pre-built, accessible, themeable components from the shadcn/ui library built on top of Radix UI:

`Accordion`, `AlertDialog`, `Alert`, `AspectRatio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Command`, `ContextMenu`, `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`, `InputOTP`, `Input`, `Label`, `Menubar`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Slider`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Toaster`, `ToggleGroup`, `Toggle`, `Tooltip`

---

## 10. AI/ML Components

### AI Analysis Components (`src/components/ai/`)

#### FinanceChatbot (`FinanceChatbot.tsx`)
- Full-featured conversational AI interface
- **Streaming responses** via Server-Sent Events from `finance-chat` edge function
- Maintains conversation history (up to 50 messages)
- System prompt makes it behave as a professional financial advisor
- Topics: stock analysis, portfolio strategy, market trends, options education

#### SentimentAnalysis (`SentimentAnalysis.tsx`)
- Displays market sentiment for a given stock symbol
- Visual gauge: bullish (green) / bearish (red) / neutral
- Shows: sentiment score (-100 to +100), confidence %, individual factors with impact weights
- Social mentions breakdown (positive/negative/neutral)
- News impact level (high/medium/low)
- Data from `sentiment-analysis` edge function

#### PricePrediction (`PricePrediction.tsx`)
- AI-generated price predictions with configurable timeframes (1 day, 1 week, 1 month, 3 months)
- Shows: current price, predicted price, price target range (low/mid/high)
- Confidence score, direction indicator, risk level
- Key factors driving the prediction
- Data from `price-prediction` edge function

#### TechnicalAnalysis (`TechnicalAnalysis.tsx`)
- Comprehensive technical indicators dashboard
- **Indicators**: RSI (overbought/oversold/neutral), MACD (signal + crossover), Moving Averages (SMA 20/50/200, golden/death cross), Bollinger Bands (position + squeeze)
- **Chart Patterns**: Identified patterns with reliability ratings
- **Support/Resistance**: Key price levels and pivot point
- **Volume Analysis**: Trend direction + accumulation/distribution signal
- **Signal Summary**: Buy/Sell/Neutral signal counts
- **Recommendation**: strong_buy / buy / hold / sell / strong_sell
- Data from `technical-analysis` edge function

### ML Training Components (`src/components/ml/`)

#### DatasetUpload (`DatasetUpload.tsx`)
- Drag-and-drop CSV file upload using PapaParse
- Previews uploaded data in a table
- Validates column structure and data types

#### TrainingConfig (`TrainingConfig.tsx`)
- Configure ML model training parameters:
  - Model type selection
  - Learning rate, epochs, batch size
  - Validation split percentage
  - Feature/target column selection

#### TrainingProgress (`TrainingProgress.tsx`)
- Real-time progress bar during model training
- Shows current epoch, loss value, estimated time remaining

#### ModelAnalytics (`ModelAnalytics.tsx`)
- Post-training performance metrics
- Accuracy, precision, recall, F1 score
- Loss curves visualization

#### ConfusionMatrix (`ConfusionMatrix.tsx`)
- Visual confusion matrix for classification models
- True positive/negative, false positive/negative counts

#### CorrelationHeatmap (`CorrelationHeatmap.tsx`)
- Feature correlation heatmap visualization
- Color-coded correlation coefficients

#### ReportsPanel (`ReportsPanel.tsx`)
- History of training runs with performance summaries
- Compare different model configurations

---

## 11. Custom Hooks

### `useUserRole()` — User Role Management
**File**: `src/hooks/useUserRole.tsx`
- Fetches the current user's role from `user_roles` table
- Returns: `{ role: 'admin'|'premium'|'free'|null, loading: boolean, hasAccess: (requiredRole) => boolean }`
- Auto-refreshes on auth state changes
- `hasAccess('premium')` returns true for premium AND admin users

### `useTokenRefresh()` — JWT Token Auto-Refresh
**File**: `src/hooks/useTokenRefresh.tsx`
- Sets up periodic token refresh to prevent session expiration
- Runs at app root level via `TokenRefreshProvider` wrapper in `App.tsx`
- Prevents 401 errors during long browsing sessions

### `useMLTraining()` — ML Training State Machine
**File**: `src/hooks/useMLTraining.tsx`
- Manages the complete ML training lifecycle
- States: idle → configuring → training → completed / error
- Handles dataset loading, validation, training simulation, results

### `useMobile()` — Responsive Detection
**File**: `src/hooks/use-mobile.tsx`
- Returns `boolean` indicating if viewport is mobile-sized
- Used by AppSidebar to auto-collapse on small screens

### `useToast()` — Toast Notifications
**File**: `src/hooks/use-toast.ts`
- Wrapper around shadcn toast system
- Provides `toast()` function for success/error/info notifications

---

## 12. External APIs & Integrations

### Finnhub Stock API
- **Purpose**: Real-time stock market data
- **API Key**: Stored as `FINNHUB_API_KEY` secret in edge function environment
- **Endpoints Used**:
  - `/api/v1/quote` — Current price, change, high/low
  - `/api/v1/stock/candle` — Historical candle data for charts
  - `/api/v1/search` — Stock symbol search
  - `/api/v1/stock/symbol` — List all symbols on an exchange
  - `/api/v1/company-news` — Recent company news (for sentiment)
  - `/api/v1/scan/technical-indicator` — Technical indicator signals
- **Fallback**: Demo/mock data when API limit is reached or errors occur

### Lovable AI Gateway (Gemini 2.5 Flash)
- **Purpose**: AI-powered financial analysis, chat, reports
- **API Key**: `LOVABLE_API_KEY` (auto-provisioned)
- **Base URL**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Model**: `google/gemini-2.5-flash`
- **Features**: Supports both standard JSON responses and SSE streaming
- **Used for**: Stock analysis, sentiment scoring, technical analysis, price predictions, chatbot conversations, report generation

---

## 13. Design System

### CSS Custom Properties (index.css)
The entire UI is themed using HSL-based CSS variables:

```css
:root {
  --background, --foreground          /* Page background/text */
  --card, --card-foreground            /* Card surfaces */
  --primary, --primary-foreground      /* Primary accent (blue) */
  --secondary, --secondary-foreground  /* Secondary surfaces */
  --muted, --muted-foreground          /* Muted/disabled states */
  --accent, --accent-foreground        /* Hover/active accent */
  --destructive                        /* Error/danger states */
  --success, --danger                  /* Green/red for stock changes */
  --border, --input, --ring            /* Form element borders */
}
```

### Custom Utility Classes
- `.glass-card` — Glassmorphism card with backdrop blur
- `.gradient-text` — Primary gradient text effect
- `.hover-lift` — Subtle scale + shadow on hover
- `.hover-glow` — Glowing primary shadow on hover
- `.shadow-glow-primary` — Primary color glow shadow
- `.bg-gradient-primary` — Primary gradient background
- `.bg-gradient-success` / `.bg-gradient-danger` — Status gradients
- `.animate-fade-in` / `.animate-scale-in` — Entry animations

### Dark Mode
Full dark mode support via `next-themes`:
- Toggled by `ThemeToggle` component
- All colors swap via `.dark` CSS class on `<html>`
- Both themes defined in `index.css`

---

## 14. Data Flow Diagrams

### Stock Data Flow
```
User opens Dashboard
  → Index.tsx useEffect fires
  → supabase.functions.invoke('fetch-stock-data', { body: { symbol: 'SPY' } })
  → Edge Function:
      1. Validates JWT token
      2. Checks rate limit
      3. Calls Finnhub API: /api/v1/quote?symbol=SPY
      4. Calls Finnhub API: /api/v1/stock/candle (4hr history)
      5. Returns { price, change, chartData }
  → MarketOverview renders cards
  → Auto-refreshes every 60 seconds via setInterval
```

### AI Analysis Flow
```
User clicks "Analyze AAPL" in AIInsights
  → supabase.functions.invoke('analyze-stock', { body: { symbol, marketContext } })
  → Edge Function:
      1. Validates JWT
      2. Checks rate limit (20/min)
      3. Fetches real-time price from Finnhub
      4. Combines with dashboard market context
      5. Sends to Gemini 2.5 Flash via Lovable AI Gateway
      6. Returns { analysis: string }
  → AIInsights parses for bullish/bearish keywords
  → Displays sentiment badge + signals grid
  → Caches result per-symbol (client-side)
```

### Report Generation Flow
```
User clicks "Generate Report" for TSLA
  → ReportGenerator calls supabase.functions.invoke('generate-report')
  → Edge Function:
      1. Auth + rate limit (10/min)
      2. Builds prompt with market data
      3. AI generates 6-section professional report
      4. Returns { report: string }
  → Client stores report in state
  → User clicks "Download PDF"
  → jsPDF renders:
      - Blue header: "FINSIGHT FINANCIAL ANALYSIS REPORT"
      - Metadata: symbol, date, platform name
      - Color-coded market overview
      - Full analysis text with word wrapping
      - Page numbers + footer on each page
      - Disclaimer on last page
  → Browser downloads PDF file
```

### Chatbot Streaming Flow
```
User types message in FinanceChatbot
  → Sends conversation history to finance-chat edge function
  → Edge Function:
      1. Auth + rate limit (30/min)
      2. Passes full history to Gemini with stream: true
      3. Returns SSE stream (text/event-stream)
  → Client reads ReadableStream chunk by chunk
  → Appends tokens to UI in real-time
  → Conversation history maintained in local state
```

---

## 15. Deployment & Configuration

### Environment Variables
| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Auto-provisioned | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-provisioned | Supabase anon key |
| `FINNHUB_API_KEY` | Secret (edge functions) | Finnhub stock data API |
| `LOVABLE_API_KEY` | Auto-provisioned | Lovable AI Gateway access |
| `SUPABASE_URL` | Auto (edge functions) | Backend Supabase URL |
| `SUPABASE_ANON_KEY` | Auto (edge functions) | Backend anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto (edge functions) | Backend service role key (for rate limiting) |

### Build & Deploy
- **Frontend**: Vite builds static assets → deployed to Lovable CDN
- **Edge Functions**: Deno functions auto-deployed on code push
- **Database**: Migrations managed via Supabase migration system
- **Preview URL**: `https://id-preview--7d13318b-40f6-4b43-a6f6-59cc93284332.lovable.app`
- **Production URL**: `https://trend-bard.lovable.app`

### Key npm Scripts
```json
{
  "dev": "vite",           // Start development server
  "build": "vite build",   // Production build
  "preview": "vite preview" // Preview production build locally
}
```

---

## Summary

FinSight is a comprehensive financial analytics platform combining:
- **Real-time market data** from Finnhub across 12+ global exchanges
- **AI-powered intelligence** via Google Gemini 2.5 Flash for analysis, sentiment, predictions, and reports
- **Cloud-backed persistence** with PostgreSQL, RLS security, and JWT authentication
- **Modern reactive UI** with 50+ accessible components, dark mode, and responsive design
- **Professional output** including downloadable PDF reports with formatted sections

The architecture follows a clean separation: React frontend → Supabase JS Client → Deno Edge Functions → External APIs (Finnhub + AI Gateway), with all user data protected by Row Level Security policies.

---

*Documentation generated for FinSight by HarshVardhanXS*
