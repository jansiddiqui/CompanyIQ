# CompanyIQ — Testing & Resiliency Guide

This document specifies the testing architecture of **CompanyIQ**, explaining how to run the prompt regression evaluations, mock simulation environments, and offline resiliency audits.

---

## 🧪 1. Active Evaluation Suites

We provide isolated validation scripts under the `scripts/` directory to run automated assertions on the AI workflows and prompt patterns.

### Prompt Regression Evaluation Suite
Asserts that prompt patterns perform correctly against deterministic context parameters and validate cleanly against the Zod schemas:
```bash
npx tsx scripts/validate-prompts.ts
```
*   **Test 1 (Scenario Simulator)**: Confirms that a risk spike query (e.g. interest rate hikes) calibrates a negative score adjustment on the correct category.
*   **Test 2 (QA Critic Node)**: Asserts that the QA Critic flags internal recommendation contradictions (e.g., INVEST verdict vs. "avoid stock" summary).
*   **Test 3 (Zod Schema Validation)**: Evaluates the explainability prompt output format, checking that all required fields parse correctly.

### Workflow Ingestion Test
Runs the LangGraph orchestration flow end-to-end for a target ticker on the CLI:
```bash
npx tsx scripts/test-run.ts
```
It prints active node state modifications, logs latency metrics, and outputs the completed JSON data brief.

---

## 🛡 2. Resiliency & Offline Simulation Audits

CompanyIQ is hardened against network timeouts and API quota exhaustion. To test these resiliency pathways, follow the steps below:

### Test Case A: Gemini API Quota Exhaustion (429 / rate limits)
1.  Temporarily change or comment out your API keys in `.env.local`:
    ```env
    # GEMINI_API_KEY="your-key"
    ```
2.  Run the server and perform a stock search.
3.  **Expected Behavior**:
    *   The app will automatically route the request through OpenRouter or Groq.
    *   If no keys are present, the backend falls back to the **Structured Mock Compiler**, which parses metrics and builds a high-quality report layout instantly.
    *   The AI Q&A Chat widget will display a warning warning the user that the standard reasoning model is offline and operating in a high-reliability keyword-matching fallback mode.

### Test Case B: Tavily & News API Outages (Network Timeout recovery)
1.  To simulate API hangs, we integrated a 6-second `AbortController` timeout inside `src/services/tavily.ts` and `src/services/news.ts`.
2.  **Expected Behavior**:
    *   If the search endpoints take longer than 6 seconds to respond, the backend catches the abort signal, prints a warning to the console, and falls back to mock search context.
    *   The overall score is calculated cleanly using financial sheets data, and the final report indicates that web/news coverage is degraded.

---

## ⏳ 3. IP-Based Rate Limiting Verification

We implement an IP-based rate limiter utility on critical API routes (`/api/research` and `/api/research/chat`) to prevent API key depletion:

*   **Constraint**: Limit of 10 research requests per minute per IP address.
*   **Testing**: Issue multiple rapid cURL queries:
    ```bash
    for i in {1..12}; do curl -i http://localhost:3000/api/research?ticker=AAPL; done
    ```
*   **Expected Result**: The 11th request will return a clean `429 Too Many Requests` HTTP status code and a JSON error payload:
    ```json
    {"error": "Too many requests. Please try again later."}
    ```
