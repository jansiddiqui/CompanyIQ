# CompanyIQ — Developer Technical Interview Guide

This guide compiles critical architectural decisions, engineering trade-offs, and design rationales for **CompanyIQ**. Use it to prepare for technical interview questions from evaluation committees.

---

## 🚀 Core Architectural Decisions

### Q1: Why LangGraph instead of a simple linear LangChain?
*   **The Problem with Linear Chains**: A standard linear chain cannot handle cyclic self-correction loops, parallel node execution, or state restoration after network timeout exceptions.
*   **The LangGraph Advantage**: LangGraph models execution as a **stateful directed graph**. It allows parallel execution of ingestion nodes (e.g. fetching financials, news sentiment, and competitor profiles simultaneously), conditional routing based on QA evaluation results (routing draft reports back to the LLM for corrections), and granular execution logs (tracing duration and metadata per node).

### Q2: Why separate the Deterministic Scoring Engine from LLM Opinion Generation?
*   **The Hallucination Problem**: When an LLM calculates financial metrics or overall ratings directly, it is highly prone to hallucination, mathematical inconsistency, and confirmation bias.
*   **The Resolution**: We separated the math from the language. 
    1.  **Deterministic Engine (TypeScript)**: Reads raw financials and calculates score outputs (0–100) using strict mathematical formulas.
    2.  **LLM Explainability (Gemini)**: Reads the raw metrics, deterministic scores, and competitor summaries, generating structured explanations, provenance traces, and risk disclosures.

### Q3: Why write a multi-provider LLM failover routing chain?
*   **The Problem**: Commercial API services are subject to daily rate limits (e.g., free tier Gemini limits are 20 calls/day), sudden auth failures, or temporary service outages.
*   **The Resolution**: We created `src/utils/llm.ts` to dynamically assemble a failover chain using any keys present in `.env.local` (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`, and `GROQ_API_KEY`). If any API call fails due to quota blocks, billing limits, or timeouts, the router catches the exception and invokes the next provider in the chain (Gemini ➔ OpenRouter ➔ Groq).

---

## 🛠 Solving Complex Production Bugs

### Q4: How did you solve the Prisma Connection Pool Leak under Next.js Hot Reloads?
*   **The Problem**: During local development, Next.js hot-reloads API routes on code edits. Standard client instantiation (`const prisma = new PrismaClient()`) runs repeatedly, leaking connection pools and throwing connection timeout errors: `Timed out fetching a new connection from the connection pool`.
*   **The Resolution**: We bound the lazy-instantiated `PrismaClient` proxy directly to the Node.js `global` object:
    ```typescript
    const globalForPrisma = global as unknown as { prisma: PrismaClient };
    export const db = globalForPrisma.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
    ```
    This ensures that subsequent hot reloads reuse the active client and pool rather than leaking connections.

### Q5: How did you resolve the LangGraph Parallel Concurrency Reducer conflict?
*   **The Problem**: During concurrent execution of parallel fetch nodes (`financialData`, `businessSearch`, `newsSentiment`) and analyst nodes (`bullAnalyst`, `bearAnalyst`), multiple nodes wrote status logs to the `progressMessage` state channel simultaneously. Since the channel had no custom reducer, it defaulted to LangGraph's `LastValue` reducer, throwing a `LastValue can only receive one value per step` runtime exception.
*   **The Resolution**: We refactored `ResearchState` to assign a thread-safe reducer function `(x, y) => y` to `progressMessage`. LangGraph now combines concurrent status messages sequentially rather than throwing an exception:
    ```typescript
    progressMessage: Annotation<string>({
      reducer: (x, y) => y,
      default: () => "",
    })
    ```

---

## 💎 Product & Security Design

### Q6: How does the application maintain security while evaluating API integrations?
*   **The Solution**: We enforce **Server-Side Authentication only**. To comply with production security standards for altuni/interview projects, client-facing forms for API key input have been completely removed. All keys are loaded securely from your server environment file (`.env.local`).

### Q7: What fallback strategies are active if the external search/data feeds fail?
*   **Offline/Timeout Resilience**:
    *   **Yahoo Finance Ingestion**: Features a fallback dictionary containing high-quality metrics for core tickers (AAPL, MSFT, TSLA, NVDA) and generates realistic, dynamically calculated mock values for any other ticker on the fly to prevent dashboard crashes.
    *   **News & Tavily Ingestion**: Wrapped in 6-second `AbortController` timeouts to prevent backend threads from hanging indefinitely, falling back to cached or mock data.
    *   **LLM Failures**: If all LLM providers in the failover chain fail, the chat agent falls back to a high-reliability local keyword parsing router.
