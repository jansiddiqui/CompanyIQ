import { FinancialMetrics } from './yahoo-finance';
import { SentimentAnalysis } from './news';

export interface ScoreBreakdown {
  financialHealth: { score: number; max: number; drivers: string[] };
  growth: { score: number; max: number; drivers: string[] };
  competitiveAdvantage: { score: number; max: number; drivers: string[] };
  valuation: { score: number; max: number; drivers: string[] };
  sentiment: { score: number; max: number; drivers: string[] };
  risk: { score: number; max: number; drivers: string[] };
}

export interface DecisionResult {
  overallScore: number;
  recommendation: 'INVEST' | 'WATCHLIST' | 'PASS';
  breakdown: ScoreBreakdown;
  scoreChanges: { label: string; value: number }[];
  watchlistDetails?: {
    lastMonitored: string;
    status: string;
    alertCondition: string;
  };
}

export function evaluateDecisionEngine(
  financials: FinancialMetrics,
  sentiment: SentimentAnalysis
): DecisionResult {
  const scoreChanges: { label: string; value: number }[] = [];

  // 1. FINANCIAL HEALTH (Weight: 30%)
  let finScore = 0;
  const finDrivers: string[] = [];
  
  // D/E Contribution (Max 10)
  const de = financials.debtToEquity;
  if (de === null) {
    finScore += 6;
    finDrivers.push("Debt-to-Equity is not available (assumed moderate risk).");
  } else if (de < 0.5) {
    finScore += 10;
    finDrivers.push("Strong balance sheet with low leverage (D/E < 0.5).");
    scoreChanges.push({ label: "Low Leverage", value: 10 });
  } else if (de <= 1.5) {
    finScore += 6;
    finDrivers.push("Moderate leverage (D/E between 0.5 and 1.5).");
    scoreChanges.push({ label: "Moderate Leverage", value: 6 });
  } else {
    finScore += 2;
    finDrivers.push("High leverage (D/E > 1.5), indicating capital structure risk.");
    scoreChanges.push({ label: "High Leverage", value: 2 });
  }

  // Profit Margin Contribution (Max 10)
  const margin = financials.profitMargin;
  if (margin === null) {
    finScore += 5;
    finDrivers.push("Profit margins are not available.");
  } else if (margin > 0.20) {
    finScore += 10;
    finDrivers.push("Excellent net profit margin (> 20%).");
    scoreChanges.push({ label: "High Profitability", value: 10 });
  } else if (margin > 0.08) {
    finScore += 6;
    finDrivers.push("Healthy operational profit margins (8% - 20%).");
    scoreChanges.push({ label: "Healthy Margins", value: 6 });
  } else if (margin > 0) {
    finScore += 3;
    finDrivers.push("Slim positive margins (< 8%).");
    scoreChanges.push({ label: "Slim Margins", value: 3 });
  } else {
    finDrivers.push("Negative net profit margins, indicating unprofitable operations.");
    scoreChanges.push({ label: "Unprofitable Operations", value: 0 });
  }

  // Cash vs Debt Contribution (Max 10)
  const cash = financials.cash || 0;
  const debt = financials.debt || 0;
  if (cash > debt) {
    finScore += 10;
    finDrivers.push("Net cash positive: Cash reserves exceed total outstanding debt.");
    scoreChanges.push({ label: "Net Cash Positive", value: 10 });
  } else if (cash > debt * 0.5) {
    finScore += 6;
    finDrivers.push("Adequate cash buffer covering over 50% of total debt.");
    scoreChanges.push({ label: "Adequate Cash Buffer", value: 6 });
  } else {
    finScore += 2;
    finDrivers.push("Low cash reserves relative to debt, limiting liquidity.");
    scoreChanges.push({ label: "Tight Cash Position", value: 2 });
  }


  // 2. GROWTH (Weight: 25%)
  let growthScore = 0;
  const growthDrivers: string[] = [];

  // YoY Revenue Growth (Max 15)
  const revGrowth = financials.revenueGrowth;
  if (revGrowth === null) {
    growthScore += 8;
    growthDrivers.push("Revenue growth statistics unavailable.");
  } else if (revGrowth > 0.20) {
    growthScore += 15;
    growthDrivers.push("Exceptional top-line expansion (> 20% YoY).");
    scoreChanges.push({ label: "Exceptional Growth", value: 15 });
  } else if (revGrowth > 0.08) {
    growthScore += 10;
    growthDrivers.push("Strong double-digit top-line growth (8% - 20% YoY).");
    scoreChanges.push({ label: "Strong Revenue Growth", value: 10 });
  } else if (revGrowth >= 0) {
    growthScore += 5;
    growthDrivers.push("Moderate or flat top-line growth (0% - 8% YoY).");
    scoreChanges.push({ label: "Moderate Growth", value: 5 });
  } else {
    growthDrivers.push("Declining revenues YoY, indicating contracting market share.");
    scoreChanges.push({ label: "Contracting Revenues", value: 0 });
  }

  // EPS Positive (Max 10)
  const eps = financials.eps;
  if (eps === null) {
    growthScore += 5;
    growthDrivers.push("EPS statistics unavailable.");
  } else if (eps > 0) {
    growthScore += 10;
    growthDrivers.push("Positive earnings per share (profitable on a trailing basis).");
    scoreChanges.push({ label: "Positive EPS", value: 10 });
  } else {
    growthDrivers.push("Negative earnings per share (trailing loss).");
    scoreChanges.push({ label: "Negative EPS", value: 0 });
  }


  // 3. COMPETITIVE ADVANTAGE (Weight: 15%)
  let compScore = 0;
  const compDrivers: string[] = [];
  const pm = financials.profitMargin || 0;

  if (pm > 0.25) {
    compScore = 15;
    compDrivers.push("High margin business indicates a strong brand moat or high barrier to entry.");
    scoreChanges.push({ label: "Strong Brand Moat", value: 15 });
  } else if (pm > 0.12) {
    compScore = 11;
    compDrivers.push("Healthy margins indicate reasonable pricing power and product differentiation.");
    scoreChanges.push({ label: "Healthy Pricing Power", value: 11 });
  } else if (pm > 0.05) {
    compScore = 6;
    compDrivers.push("Average margins suggest a competitive industry with moderate pricing power.");
    scoreChanges.push({ label: "Average Competitive Position", value: 6 });
  } else {
    compScore = 2;
    compDrivers.push("Commoditized margins indicate low barriers to entry and intense competition.");
    scoreChanges.push({ label: "Commoditized Operations", value: 2 });
  }


  // 4. VALUATION (Weight: 10%)
  let valScore = 0;
  const valDrivers: string[] = [];
  const pe = financials.peRatio;

  if (pe === null) {
    valScore = 5;
    valDrivers.push("P/E ratio unavailable.");
  } else if (pe <= 0) {
    valScore = 0;
    valDrivers.push("Unprofitable (negative P/E), high valuation risk.");
    scoreChanges.push({ label: "Negative P/E Multiples", value: 0 });
  } else if (pe < 15) {
    valScore = 10;
    valDrivers.push("Undervalued: P/E is under 15, attractive entry point.");
    scoreChanges.push({ label: "Highly Attractive P/E", value: 10 });
  } else if (pe < 30) {
    valScore = 7;
    valDrivers.push("Fairly valued: P/E sits between 15 and 30, typical of stable firms.");
    scoreChanges.push({ label: "Fairly Valued Multiples", value: 7 });
  } else if (pe < 50) {
    valScore = 4;
    valDrivers.push("Growth premium: P/E between 30 and 50, pricing in high future expectations.");
    scoreChanges.push({ label: "High Growth Premium", value: 4 });
  } else {
    valScore = 1;
    valDrivers.push("Expensive: P/E exceeds 50, high valuation multiple risk.");
    scoreChanges.push({ label: "Expensive Multiples", value: 1 });
  }


  // 5. SENTIMENT (Weight: 10%)
  const sentScoreRaw = sentiment.score; // 0 - 100
  const sentScore = Math.round((sentScoreRaw / 100) * 10);
  const sentDrivers: string[] = [
    `Public sentiment score is ${sentScoreRaw}% based on media analysis.`,
    `Sentiment class: ${sentiment.overallSentiment}.`
  ];
  scoreChanges.push({ label: "Positive Sentiment Impact", value: sentScore });


  // 6. RISK ASSESSMENT (Weight: 10%)
  // Start with 10, deduct for risk flags
  let riskScore = 10;
  const riskDrivers: string[] = [];

  // Flag 1: High P/E
  if (pe !== null && pe > 45) {
    riskScore -= 2;
    riskDrivers.push("Multiple Risk: High P/E ratio (> 45) presents downside volatility risk.");
    scoreChanges.push({ label: "High P/E Volatility Risk", value: -2 });
  }
  // Flag 2: Negative FCF
  if (financials.freeCashFlow !== null && financials.freeCashFlow < 0) {
    riskScore -= 3;
    riskDrivers.push("Liquidity Risk: Negative Free Cash Flow limits operational self-funding.");
    scoreChanges.push({ label: "Negative Cash Flow Risk", value: -3 });
  }
  // Flag 3: High Debt
  if (de !== null && de > 1.8) {
    riskScore -= 3;
    riskDrivers.push("Solvency Risk: High debt-to-equity ratio indicates excessive leverage.");
    scoreChanges.push({ label: "Excessive Leverage Risk", value: -3 });
  }
  // Flag 4: Bearish Sentiment
  if (sentiment.overallSentiment === 'Bearish') {
    riskScore -= 2;
    riskDrivers.push("Market Sentiment Risk: Media reports highlight negative short-term outlooks.");
    scoreChanges.push({ label: "Bearish Sentiment Risk", value: -2 });
  }

  if (riskScore === 10) {
    riskDrivers.push("Low risk profile: Strong metrics across liquidity, leverage, and sentiment.");
    scoreChanges.push({ label: "Low Risk Profile", value: 10 });
  }
  
  // Bound risk score between 1 and 10
  riskScore = Math.max(1, Math.min(10, riskScore));


  // Calculate Overall Score (Sum of scores)
  const overallScore = finScore + growthScore + compScore + valScore + sentScore + riskScore;

  // Determine recommendation
  let recommendation: 'INVEST' | 'WATCHLIST' | 'PASS' = 'WATCHLIST';
  if (overallScore >= 75) recommendation = 'INVEST';
  else if (overallScore < 50) recommendation = 'PASS';

  return {
    overallScore,
    recommendation,
    breakdown: {
      financialHealth: { score: finScore, max: 30, drivers: finDrivers },
      growth: { score: growthScore, max: 25, drivers: growthDrivers },
      competitiveAdvantage: { score: compScore, max: 15, drivers: compDrivers },
      valuation: { score: valScore, max: 10, drivers: valDrivers },
      sentiment: { score: sentScore, max: 10, drivers: sentDrivers },
      risk: { score: riskScore, max: 10, drivers: riskDrivers }
    },
    scoreChanges,
    watchlistDetails: {
      lastMonitored: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "Active Monitoring",
      alertCondition: recommendation === 'INVEST' ? "Price Alert ±5%" : "Earnings report updates"
    }
  };
}
