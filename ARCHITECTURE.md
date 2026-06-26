# CompanyIQ — System Architecture Specification

This document provides a technical specification of the system architecture of **CompanyIQ**, highlighting the multi-agent orchestration, data streaming mechanisms, and deterministic scoring calculations.

---

## 📌 Orchestration Engine: LangGraph.js

CompanyIQ implements a structured, state-driven workflow using **LangGraph.js** (`@langchain/langgraph`). Unlike basic linear chain workflows, LangGraph allows modeling cycles, conditional routing, state reduction, and parallel execution pathways.

### Ingestion Graph Workflow

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

---

## 💾 State Management & Reducers

The execution state is defined by the LangGraph `ResearchState` schema. A centralized state object is passed between nodes, with specific fields utilizing thread-safe custom reducers to prevent concurrency conflicts.

```typescript
export const ResearchState = Annotation.Root({
  ticker: Annotation<string>(),
  companyName: Annotation<string>(),
  financials: Annotation<FinancialMetrics | null>(),
  searchData: Annotation<SearchResponse | null>(),
  newsSentiment: Annotation<SentimentAnalysis | null>(),
  decision: Annotation<DecisionResult | null>(),
  explainability: Annotation<any | null>(),
  report: Annotation<any | null>(),
  
  // Custom reducers handling concurrency
  trace: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  progressMessage: Annotation<string>({
    reducer: (x, y) => y, // Overwrites status message sequentially
    default: () => "",
  }),
  criticFeedback: Annotation<string | null>(),
  criticAttempts: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  bullCase: Annotation<string | null>(),
  bearCase: Annotation<string | null>(),
  previousReport: Annotation<any | null>({
    reducer: (x, y) => y,
    default: () => null,
  })
});
```

---

## ⚙ Node Specifications

### 1. Input Validator Node
*   **Purpose**: Sanitizes raw user search queries.
*   **Logic**: Trims whitespace, strips non-alphanumeric characters, translates exchange syntax, and validates input length constraints using a standard Zod schema query guard.

### 2. Company Resolver Node
*   **Purpose**: Resolves plain-text company names to ticker symbols (e.g. "Apple" ➔ `AAPL`) using Yahoo Finance ticker lookup tables.

### 3. Financial Data Retriever Node
*   **Purpose**: Gathers core financial sheets and valuation multiples.
*   **Logic**: Fetches balance sheets, income statement histories, and cash flow records from Yahoo Finance. Includes a local, dynamically generated mock compiler to support high-reliability offline execution.

### 4. Business & Moat Search Node
*   **Purpose**: Audits qualitative company advantages, products, and peers.
*   **Logic**: Performs structural queries via Tavily Search API.

### 5. News & Sentiment Analyzer Node
*   **Purpose**: Analyzes public opinion.
*   **Logic**: Gathers news headlines over the trailing 30 days and calculates weighted positive vs. negative sentiment parameters.

### 6. Deterministic Decision Engine Node
*   **Purpose**: Evaluates investment viability without LLM hallucination.
*   **Logic**: Passes financials and news sentiment parameters through mathematical scoring logic to calculate a final rating (0 to 100).

### 7. Bull/Bear Analyst Agents Node
*   **Purpose**: Synthesizes opposing financial arguments.
*   **Logic**: Invokes the LLM failover chain twice concurrently:
    *   *Bull Analyst*: Constructs the strongest possible investment case (brand moats, margin expansion, growth vectors).
    *   *Bear Analyst*: Details potential structural threats (leverage, multiple compressions, competitor entry).

### 8. Explainability & Quality Critique Nodes
*   **Purpose**: Reviews report consistency and formats output.
*   **Logic**: The Explainability Generator reads raw financial data sheets, bull/bear theses, and deterministic rating scores, outputting a structured report validating against `ExplainabilityReportSchema`. This draft is reviewed by a QA Critic node; if inconsistencies are detected, it is routed back for correction before final serialization.

---

## 🧮 Deterministic Scoring Logic

Scoring is governed by a mathematically locked model containing 6 distinct categories:

$$\text{Overall Score} = \text{Financial Health} (30\%) + \text{Growth} (25\%) + \text{Moat} (15\%) + \text{Valuation} (10\%) + \text{Sentiment} (10\%) + \text{Risk Buffer} (10\%)$$

### Scoring Deductions & Triggers:
*   **Financial Health (30 pts)**: Debt-to-Equity $< 0.5$ ($+10$), Profit Margin $> 20\%$ ($+10$), Net Cash Positive ($+10$).
*   **Growth (25 pts)**: YoY Revenue Growth $> 20\%$ ($+15$), Positive EPS ($+10$).
*   **Competitive Moat (15 pts)**: Net profit margins relative to sector benchmarks ($> 25\%$ margin maps to maximum score).
*   **Valuation (10 pts)**: Trailing P/E $< 15$ ($+10$), $15 \le \text{P/E} < 30$ ($+7$), $\text{P/E} \ge 50$ ($+1$).
*   **Sentiment (10 pts)**: Calibrated directly from positive sentiment article ratios.
*   **Risk Buffer (10 pts)**: Deducts points for negative cash flows ($-3$), excessive leverage ($-3$), or high valuation volatility ($-2$).

---

## ⚡ Server-Sent Events (SSE) Streaming

CompanyIQ uses Server-Sent Events (SSE) via the Next.js API route `GET /api/research` to stream live execution status updates.

1.  **State Logs**: As each LangGraph node finishes execution, it sends a payload:
    ```json
    data: {"status": "processing", "message": "Retrieved financial data sheets", "node": "financialData"}
    ```
2.  **Report Stream**: Once explanation synthesis is completed and validated by the Zod compiler, the final structured payload is streamed as a single text block.
3.  **Client-Side Connection**: The React dashboard uses a standard `EventSource` subscriber to capture status logs in a terminal visualizer, transitioning to the final report dashboard without layout shift.
