import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/utils/llm";
import { checkRateLimit } from "@/utils/rate-limit";
import { getCurrentUser } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    // Authentication guard — AI chat requires a valid session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // Rate limit gate to prevent Gemini API quota exhaustion
    const rateLimit = checkRateLimit(ip, 12, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: "Too Many Requests. Rate limit exceeded (12 requests per minute)." 
      }, { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        }
      });
    }

    const { message, reportContext, history = [] } = await req.json();

    if (!message || !reportContext) {
      return NextResponse.json({ error: "Missing message or reportContext" }, { status: 400 });
    }

    const ticker = reportContext.company.ticker;
    const name = reportContext.company.name;
    const currentScore = reportContext.scores.overall;
    const msgLower = message.toLowerCase();

    let isScenario = false;
    let scenarioLabel = "";
    let scoreAdjustment = 0;
    let categoryAdjusted: string | null = null;
    let adjustmentReason = "";

    const hasKeys = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;

    if (hasKeys) {
      try {

        const checkPrompt = `You are a Quantitative Financial Risk Analyst. Your job is to analyze if a user's question describes a hypothetical business stress scenario (e.g., interest rate increases, revenue slowdowns, competitor market entry, margin compressions, negative press waves, raw material supply shocks) and compute a dynamic impact adjustment on our 100-point company scoring model.

        Here is the company report context:
        ${JSON.stringify({
          companyName: name,
          ticker: ticker,
          financialHealth: reportContext.financialHealth,
          scores: reportContext.scores
        })}

        User Question: "${message}"

        Evaluate if this is a scenario check. If yes, compute:
        1. "scenarioLabel": A short professional label (e.g., "Interest Rates Rise (+2%)").
        2. "scoreAdjustment": An integer between -15 and 15 representing the rating model impact. Deduct points for risks, add for positive catalysts. Be mathematically rigorous based on their cash/debt/margins.
        3. "categoryAdjusted": Must be one of: "financialHealth" | "growth" | "competitiveAdvantage" | "valuation" | "sentiment" | "risk".
        4. "adjustmentReason": A detailed, professional 2-sentence rationale outlining the mathematical or operational impact (e.g., citing debt load, interest coverage, or margin compression).

        Output a JSON object with keys "isScenario" (boolean), "scenarioLabel" (string), "scoreAdjustment" (number), "categoryAdjusted" (string), and "adjustmentReason" (string). If it is NOT a scenario query, set "isScenario": false.
        Output raw JSON only. Do not include markdown code fences or backticks.`;

        const checkText = await callLLM(checkPrompt, { temperature: 0.1 });
        const jsonStr = checkText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const scenarioAnalysis = JSON.parse(jsonStr);

        if (scenarioAnalysis.isScenario) {
          isScenario = true;
          scenarioLabel = scenarioAnalysis.scenarioLabel;
          scoreAdjustment = scenarioAnalysis.scoreAdjustment;
          categoryAdjusted = scenarioAnalysis.categoryAdjusted;
          adjustmentReason = scenarioAnalysis.adjustmentReason;
        }
      } catch (err) {
        console.warn("Dynamic scenario analysis call failed, falling back to static regex:", err);
      }
    }

    // Heuristic fallback if dynamic check is inactive or failed to detect
    if (!isScenario) {
      if (msgLower.includes("revenue growth drops") || msgLower.includes("growth slows") || msgLower.includes("revenue drops")) {
        isScenario = true;
        scenarioLabel = "Revenue Growth Contracts (to < 5%)";
        scoreAdjustment = -10;
        categoryAdjusted = "growth";
        adjustmentReason = "Deducted 10 points due to compression of YoY top-line expansion.";
      } else if (msgLower.includes("interest rates rise") || msgLower.includes("rates increase") || msgLower.includes("cost of debt")) {
        isScenario = true;
        scenarioLabel = "Interest Rates Rise (+2%)";
        scoreAdjustment = -8;
        categoryAdjusted = "risk";
        adjustmentReason = "Deducted 8 points in Risk/Financial Health due to increased capital expense and interest coverage pressure.";
      } else if (msgLower.includes("competitor enters") || msgLower.includes("competition intensifies") || msgLower.includes("margins compress")) {
        isScenario = true;
        scenarioLabel = "Margins Compress / Market Share Loss";
        scoreAdjustment = -7;
        categoryAdjusted = "competitiveAdvantage";
        adjustmentReason = "Deducted 7 points due to competitive pricing pressure eroding economic moat.";
      } else if (msgLower.includes("sentiment turns bearish") || msgLower.includes("bad news") || msgLower.includes("lawsuit")) {
        isScenario = true;
        scenarioLabel = "Negative Public Sentiment Wave";
        scoreAdjustment = -6;
        categoryAdjusted = "sentiment";
        adjustmentReason = "Deducted 6 points in Sentiment due to media headwinds.";
      }
    }

    let updatedScores = null;
    if (isScenario && categoryAdjusted) {
      const originalOverall = currentScore;
      const newOverall = Math.max(0, Math.min(100, originalOverall + scoreAdjustment));
      
      // Determine new recommendation
      let newRec: 'INVEST' | 'WATCHLIST' | 'PASS' = 'WATCHLIST';
      if (newOverall >= 75) newRec = 'INVEST';
      else if (newOverall < 50) newRec = 'PASS';

      updatedScores = {
        originalScore: originalOverall,
        simulatedScore: newOverall,
        originalRecommendation: reportContext.recommendation,
        simulatedRecommendation: newRec,
        adjustment: scoreAdjustment,
        label: scenarioLabel,
        reason: adjustmentReason
      };
    }

    let isQuotaExceeded = false;
    let responseText = "";

    if (hasKeys) {
      try {

        // Prompt that includes report context and scenario adjustment details if applicable
        const prompt = `You are a Senior Investment Research Analyst chat assistant. You are helping a client understand a research report generated for ${name} (${ticker}).
        
        Here is the report context:
        ${JSON.stringify({
          company: reportContext.company,
          overview: reportContext.overview,
          scores: reportContext.scores,
          recommendation: reportContext.recommendation,
          financialHealth: reportContext.financialHealth.facts,
          whyInvest: reportContext.whyInvest,
          whyNot: reportContext.whyNot,
        })}

        ${isScenario && updatedScores ? `
        SCENARIO SIMULATION ACTIVE:
        The user has run a scenario check: "${scenarioLabel}".
        We recalculated the deterministic model:
        - Original Score: ${updatedScores.originalScore} (Rating: ${updatedScores.originalRecommendation})
        - Simulated Score: ${updatedScores.simulatedScore} (Simulated Rating: ${updatedScores.simulatedRecommendation})
        - Impact: ${updatedScores.adjustment} points.
        - Reason: ${updatedScores.reason}
        ` : ''}

        User Question: "${message}"

        Provide a clear, detailed, and evidence-grounded answer based strictly on the report details. ${isScenario ? 'Acknowledge the scenario simulation, explain the scoring impact mathematically, and discuss how the business model handles this hypothetical challenge (specifically citing cash reserves, moats, and risk vectors from the report).' : 'Explain the numbers and rationale clearly, citing sections of the report.'} Keep your tone professional and objective.`;

        responseText = await callLLM(prompt, { temperature: 0.2 });
      } catch (err: any) {
        console.warn("Gemini chat node failed. Using template chat fallback: " + err.message);
        if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("LimitExceeded")) {
          isQuotaExceeded = true;
        }
      }
    }

    // High quality template chat answers if Gemini is missing or failed
    if (!responseText) {
      if (isScenario && updatedScores) {
        responseText = `### Scenario Analysis: ${scenarioLabel}

Running this scenario results in a **${updatedScores.adjustment} point impact** on the scoring model, reducing the overall score from **${updatedScores.originalScore}** to **${updatedScores.simulatedScore}**. This shifts the simulated recommendation to **${updatedScores.simulatedRecommendation}**.

**Core Vulnerabilities Identified:**
1. **${updatedScores.label}**: ${updatedScores.reason}
2. **Buffer Capacity**: ${ticker} has cash reserves of $${(reportContext.financialHealth.facts.cash / 1e9).toFixed(1)}B, which acts as a primary buffer. Under this stress test, the company remains solvent but the growth premium multiple compresses.
3. **Moat Resiliency**: The economic moat (${reportContext.overview.competitiveMoat.slice(0, 100)}...) will be tested. Margins would likely compress from the current ${(reportContext.financialHealth.facts.profitMargin * 100).toFixed(1)}% level, bringing P/E multiples down.

*This simulated adjustment is calculated using the deterministic engine constraints defined in our architecture rules.*`;
      } else {
        // Standard Q&A replies based on ticker
        if (msgLower.includes("why invest") || msgLower.includes("reasons to invest") || msgLower.includes("catalyst")) {
          responseText = `Based on the generated report, here are the core reasons to invest in **${name} (${ticker})**:\n\n` + 
            (reportContext.whyInvest || []).map((pt: string, i: number) => `${i+1}. **${pt.split(":")[0] || "Key Catalyst"}**: ${pt}`).join("\n\n");
        } else if (msgLower.includes("risk") || msgLower.includes("why not") || msgLower.includes("threat")) {
          responseText = `The primary risk vectors and triggers that could break the investment thesis for **${name} (${ticker})** include:\n\n` +
            (reportContext.whyNot || []).map((pt: string, i: number) => `${i+1}. **${pt.split(":")[0] || "Risk Alert"}**: ${pt}`).join("\n\n");
        } else if (msgLower.includes("growth") || msgLower.includes("revenue growth") || msgLower.includes("expansion")) {
          responseText = `### Key Growth Drivers & Catalysts: **${name} (${ticker})**\n\n` +
            (reportContext.growthDrivers || []).map((pt: string, i: number) => `- **${pt.split(":")[0] || "Growth Catalyst"}**: ${pt}`).join("\n\n");
        } else if (msgLower.includes("moat") || msgLower.includes("competitive advantage") || msgLower.includes("pricing power")) {
          responseText = `### Economic Moat & Competitive Advantage: **${name} (${ticker})**\n\n` +
            `${reportContext.overview.competitiveMoat || "No competitive moat assessment available."}`;
        } else if (msgLower.includes("summary") || msgLower.includes("overview") || msgLower.includes("business") || msgLower.includes("profile")) {
          responseText = `### Business Overview & Executive Summary: **${name} (${ticker})**\n\n` +
            `#### Executive Summary:\n${reportContext.overview.executiveSummary || "N/A"}\n\n` +
            `#### Business Operations:\n${reportContext.overview.businessOverview || "N/A"}`;
        } else if (msgLower.includes("counterargument") || msgLower.includes("bear case") || msgLower.includes("objection")) {
          responseText = `### Bear Case & Counterarguments: **${name} (${ticker})**\n\n` +
            (reportContext.overview.counterArguments || []).map((pt: string, i: number) => `${i+1}. **Bear Case Objection**: ${pt}`).join("\n\n");
        } else if (msgLower.includes("assumption") || msgLower.includes("limitation") || msgLower.includes("checklist")) {
          responseText = `### Report Assumptions & Scope Limitations:\n\n` +
            `#### Analytical Assumptions:\n` + (reportContext.overview.assumptions || []).map((pt: string) => `- ${pt}`).join("\n") + `\n\n` +
            `#### Scope Limitations:\n` + (reportContext.overview.limitations || []).map((pt: string) => `- ${pt}`).join("\n");
        } else if (msgLower.includes("news") || msgLower.includes("headline") || msgLower.includes("sentiment")) {
          const articlesList = (reportContext.recentNews?.articles || [])
            .slice(0, 3)
            .map((art: any) => `- **${art.title}** (Sentiment: *${art.sentiment}*)\n  *Summary: ${art.summary}*`)
            .join("\n\n");
          responseText = `### News Flow & Sentiment Analysis: **${name} (${ticker})**\n\n` +
            `- **Overall Media Sentiment**: **${reportContext.recentNews?.sentiment || "NEUTRAL"}**\n` +
            `- **Sentiment Ingestion Score**: **${reportContext.recentNews?.sentimentScore || 50}/100**\n\n` +
            `#### Recent Headings Scan:\n${articlesList || "No recent news headlines ingested."}`;
        } else if (msgLower.includes("score") || msgLower.includes("rating") || msgLower.includes("verdict")) {
          const bd = reportContext.scores?.breakdown || {};
          responseText = `### Rating Verdict & Score Breakdown: **${name} (${ticker})**\n\n` +
            `- **Overall Consensus Verdict**: **${reportContext.recommendation || "WATCHLIST"}**\n` +
            `- **Calibrated Model Score**: **${reportContext.scores?.overall || 50}/100**\n\n` +
            `#### Dimension Scores:\n` +
            `- **Financial Health**: ${bd.financialHealth?.score || 0}/${bd.financialHealth?.max || 20}\n` +
            `- **Growth Catalysts**: ${bd.growth?.score || 0}/${bd.growth?.max || 20}\n` +
            `- **Competitive Moat**: ${bd.competitiveAdvantage?.score || 0}/${bd.competitiveAdvantage?.max || 20}\n` +
            `- **Valuation Multiples**: ${bd.valuation?.score || 0}/${bd.valuation?.max || 20}\n` +
            `- **Sentiment Weight**: ${bd.sentiment?.score || 0}/${bd.sentiment?.max || 15}\n` +
            `- **Risk Buffer**: ${bd.risk?.score || 0}/${bd.risk?.max || 5}`;
        } else if (msgLower.includes("pe ratio") || msgLower.includes("valuation") || msgLower.includes("cheap")) {
          responseText = `### Valuation Analysis: **${name} (${ticker})**\n\n` +
            `- **P/E Ratio (TTM)**: ${reportContext.financialHealth.facts.peRatio || "N/A"}\n` +
            `- **PEG Ratio**: ${reportContext.financialHealth.facts.pegRatio || "N/A"}\n` +
            `- **Price to Book**: ${reportContext.financialHealth.facts.priceToBook || "N/A"}\n` +
            `- **Net Profit Margin**: ${reportContext.financialHealth.facts.profitMargin ? (reportContext.financialHealth.facts.profitMargin * 100).toFixed(1) + "%" : "N/A"}\n\n` +
            `The company's valuation profiles earn a score of **${reportContext.scores?.breakdown?.valuation?.score || 0}/${reportContext.scores?.breakdown?.valuation?.max || 20}** in our deterministic engine.`;
        } else if (msgLower.includes("debt") || msgLower.includes("borrowing") || msgLower.includes("cash") || msgLower.includes("liquidity") || msgLower.includes("fcf") || msgLower.includes("balance sheet")) {
          const cashVal = reportContext.financialHealth.facts.cash ? `$${(reportContext.financialHealth.facts.cash / 1e9).toFixed(2)}B` : "N/A";
          const debtVal = reportContext.financialHealth.facts.debt ? `$${(reportContext.financialHealth.facts.debt / 1e9).toFixed(2)}B` : "N/A";
          const fcfVal = reportContext.financialHealth.facts.freeCashFlow ? `$${(reportContext.financialHealth.facts.freeCashFlow / 1e9).toFixed(2)}B` : "N/A";
          
          responseText = `### Leverage & Liquidity Brief: **${name} (${ticker})**\n\n` +
            `- **Cash Reserves**: **${cashVal}**\n` +
            `- **Total Borrowing**: **${debtVal}**\n` +
            `- **Net Cushion**: ${reportContext.financialHealth.facts.cash && reportContext.financialHealth.facts.debt 
              ? `${reportContext.financialHealth.facts.cash > reportContext.financialHealth.facts.debt ? "Net positive cash cushion of $" + ((reportContext.financialHealth.facts.cash - reportContext.financialHealth.facts.debt) / 1e9).toFixed(2) + "B." : "Net debt load of $" + ((reportContext.financialHealth.facts.debt - reportContext.financialHealth.facts.cash) / 1e9).toFixed(2) + "B."}`
              : "Data incomplete."}\n` +
            `- **Debt-to-Equity Ratio**: **${reportContext.financialHealth.facts.debtToEquity || "N/A"}**\n` +
            `- **Trailing Free Cash Flow (TTM)**: **${fcfVal}**\n\n` +
            `**Cushion Assessment**: ${reportContext.financialHealth.facts.cash && reportContext.financialHealth.facts.debt && reportContext.financialHealth.facts.cash > reportContext.financialHealth.facts.debt 
              ? "The company's substantial cash cushion completely offsets its leverage risk, providing solid buffer capacity." 
              : "The company carries significant debt relative to its cash reserves, requiring persistent free cash flow margins to service interest obligations."}`;
        } else {
          responseText = `I can help you analyze the generated report for **${name} (${ticker})** in detail. Since the live Gemini model is offline, you can query specific sections using keywords:\n\n` +
            `- **"verdict" / "score"** to see the overall ranking details.\n` +
            `- **"why invest" / "reasons"** to view core positive catalysts.\n` +
            `- **"risks" / "why not"** to see threat vectors.\n` +
            `- **"growth"** to view driver catalysts.\n` +
            `- **"moat" / "advantage"** to check the competitive position.\n` +
            `- **"financials" / "cash" / "debt"** to inspect liquidity details.\n` +
            `- **"valuation" / "pe ratio"** to check trading multiples.\n` +
            `- **"news" / "sentiment"** to view headlines and sentiment scores.\n` +
            `- **"bear case" / "objections"** to inspect counterarguments.`;
        }
      }

      if (isQuotaExceeded) {
        responseText = `⚠️ **Gemini API daily quota limit exceeded** (Free Tier is limited to 20 calls/day). Standard reasoning model is offline. Operating in high-reliability keyword-matching fallback mode.\n\n` + responseText;
      }
    }

    return NextResponse.json({
      response: responseText,
      updatedScores,
    });
  } catch (error: any) {
    console.error("Failed to run Q&A chat endpoint:", error);
    return NextResponse.json({ error: "Failed to process chat query" }, { status: 500 });
  }
}
