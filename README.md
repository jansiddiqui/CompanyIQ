# CompanyIQ - Professional AI Investment Research Platform

CompanyIQ is an enterprise-grade AI-powered investment research platform designed to automate deep equity research and justify every recommendation. Styled after modern minimal interfaces like Perplexity, Stripe, and Linear, it uses a mathematically locked scoring model and structured AI reasoning to provide trustworthy, explainable stock analysis.

---

## 📌 Architecture Overview

CompanyIQ implements a structured, multi-stage LangGraph workflow. To prevent hallucinations and enforce analytical integrity, it separates **Fact Retrieval** (API metrics Ingestion) from **AI Opinion Generation** (LLM Synthesis). 

```
                                  [ USER REQUEST ]
                                         │
                                         ▼
                            [ Next.js API: /api/research ]
                                         │
                                         ▼
                             ┌───────────────────────┐
                             │    LANGGRAPH FLOW     │
                             │                       │
                             │  1. Input Validator   │
                             │          │            │
                             │  2. Company Resolver  │
                             │          │            │
                             │  3. Financial Data    │
                             │          │            │
                             │  4. Business Search   │
                             │          │            │
                             │  5. News & Sentiment  │
                             └──────────┬────────────┘
                                        │
                                        ▼
                         [ Deterministic Scoring Engine ]
                                        │
                                        ▼
                         [ Explainability Generator LLM ]
                                        │
                                        ▼
                             [ Output Formatter ]
                                        │
                                        ▼
                          [ Server-Sent Events Stream ]
                                        │
                                        ▼
                             [ Dashboard Interface ]
```

### 1. Ingestion Node Pipeline (LangGraph)
*   **Input Validator**: Sanitizes and sanitizes query input strings.
*   **Company Resolver**: Resolves keywords to ticker symbols (e.g. "Apple" ➔ `AAPL`) using Yahoo Finance.
*   **Financial Data Retriever**: Ingests income statements, balance sheets, cash flows, and valuation multiples using `yahoo-finance2`.
*   **Business & Moat Search**: Scrapes qualitative company details, product lines, and competitor listings via Tavily Search.
*   **News & Sentiment Node**: Collects media coverage from the last 30 days and determines sentiment weights (Positive, Negative, Neutral).

### 2. Deterministic Scoring Engine
Rather than allowing the LLM to invent scores, our decision engine calculates values mathematically:
*   **Financial Health (30%)**: Leverages cash-to-debt ratios, profit margins, and debt-to-equity leverage.
*   **Growth (25%)**: Evaluates YoY top-line revenue growth and trailing EPS.
*   **Competitive Advantage (15%)**: Assesses pricing power and margins compared to sector baselines.
*   **Valuation (10%)**: Compares P/E and PEG ratios against valuation multiples.
*   **Sentiment (10%)**: Calibrates scores based on media sentiment coverage ratios.
*   **Risk Profile (10%)**: Flags solvency, multiple valuations, and FCF levels.

### 3. Explainability & Synthesis Node (Gemini)
The LLM (Gemini 2.5 Flash) reads the compiled raw data sheets and deterministic scores, generating:
*   Executive investment verdict summaries.
*   "Why Not?" warnings detailing specific catalysts that would break the investment thesis.
*   Contextual suggested questions.
*   Granular source citations mapped to specific categories.

---

## 🛠 Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **Type Safety**: TypeScript & Zod (validation schemas)
*   **Styling**: Tailwind CSS v4 & Framer Motion (animations & transitions)
*   **AI Agent Orchestration**: LangGraph.js & LangChain.js
*   **AI Core**: Google Gen AI SDK (`@langchain/google-genai` / Gemini 2.5 Flash)
*   **Financial Data Ingestion**: Yahoo Finance API Wrapper (`yahoo-finance2`)
*   **Search Engine Ingestion**: Tavily Search API
*   **Database Client**: Prisma Client (PostgreSQL / SQLite fallback)
*   **Charts**: Recharts (dynamic client rendering)

---

## 📂 Directory Structure

```
src/
├── agents/
│   └── langgraph/            # State, nodes, andcompiled StateGraph
├── app/
│   ├── api/
│   │   ├── history/          # Logs queries
│   │   ├── research/         # Node pipeline streaming (SSE)
│   │   │   └── chat/         # Interactive Q&A & Scenario Analysis
│   │   └── watchlist/        # Watchlist bookmarks
│   ├── architecture/         # Page detailing platform flow
│   ├── research/[ticker]/    # Bloomberg-inspired results dashboard
│   ├── watchlist/            # List of bookmarked assets
│   ├── globals.css           # Token color system & glass styles
│   └── layout.tsx            # Global layout & Inter font loading
├── components/
│   ├── ui/                   # Reusable glassmorphic UI components
│   └── Sidebar.tsx           # Global sidebar navigation
├── lib/
│   └── db.ts                 # Lazy-initialized database proxy client
├── services/                 # Integrations (Yahoo, Tavily, News, Math Engine)
└── utils/
    └── cn.ts                 # Tailwind class merges
```

---

## ⚡ Setup & Installation

### Prerequisites
*   Node.js v18+
*   npm or pnpm

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Optional: Neon/PostgreSQL URL. If left empty, the setup script configures an SQLite DB dev.db automatically.
DATABASE_URL="postgresql://user:password@neon-host/dbname"

# Required for Live AI generation. If omitted, the system falls back to a mock report engine for previewing.
GEMINI_API_KEY="your-gemini-api-key"
TAVILY_API_KEY="your-tavily-api-key"
NEWS_API_KEY="your-news-api-key"
```

### 3. Initialize the Database Schema
We provide an automated setup script that inspects your `.env.local` file. If no Postgres URL is provided, it configures a local SQLite file, updates the schema provider, and runs migrations:
```bash
node scripts/prisma-setup.js
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ Trust & Explainability Layer (CTO Audit Refinements)

CompanyIQ stands out from standard wrappers by implementing a dedicated AI trust and engineering transparency layer designed to satisfy institutional compliance requirements:

1. **Decision Provenance**: Every thesis point is mapped directly to a provenance grid trace containing specific assertions, subcase indicators (`bull` vs. `bear`), specific cited evidence sentences, and reliability levels (`High Reliability`, `Medium Reliability`, `Low Reliability`).
2. **Recommendation Stability & Change Logs**: Before executing the LangGraph agent, the platform queries SQLite for the previous run's report. It calculates the delta and outputs a detailed verdict change log explaining score shifts or stability reasons.
3. **Source Conflict Resolution**: The system detects opposing signals (e.g. strong financials with negative news) and renders an alert panel explaining the reasoning behind the divergence.
4. **Calibrated Uncertainty Language**: Prompts enforce objective, hedged terminology ("The available evidence suggests...", "Confidence is moderate because...") and replace simplistic star ratings with text-based reliability tags.
5. **Research Completeness Tracker**: Highlights successfully audited dimensions vs. un-evaluated gaps (such as supplier agreements or direct management Q&As).
6. **Hidden Engineering Diagnostics Modal (`Ctrl + Shift + I`)**: Provides interviewers and evaluators with a real-time diagnostics drawer displaying active LangGraph variables, node sequence paths, confidence formulas, latency metrics, prompt versions, and a collapsible JSON state tree.

---

## 💎 Key Production Design Rationale

### 1. Lazy-Loaded Database Client Proxy
To prevent `PrismaClient` from instantiating during Next.js build-time static page pre-rendering, we wrap it in a **Javascript Proxy**. This delays instantiation until the first runtime query, resolving compilation errors.

### 2. SSE Progress Streaming
Rather than showing a static "Loading..." page, the search results stream progress updates from each LangGraph node. Each processing step lights up sequentially, showing raw logs in a virtual terminal box.

### 3. Interactive Scenario Analysis
After report generation, users can trigger stress-testing scenarios (e.g. rate hikes, margin compressions). The backend recalculates deterministic score weights and prompts the AI to explain the simulated impact.

### 4. Fact vs. AI Separation
All balance sheets, multiples, and historical charts are loaded from raw API feeds into structured "Fact Cards". Qualitative summaries and Moat reviews are separated in distinct cards to defend analytical objectivity.

---
*Disclaimer: CompanyIQ is a research demonstration project developed by Jan Mohammad and should not be used as professional financial advice.*
