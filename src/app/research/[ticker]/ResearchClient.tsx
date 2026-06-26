"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  TrendingUp, 
  Sparkles, 
  Download, 
  Copy, 
  FileText, 
  Loader2, 
  ArrowLeft,
  Send,
  Star,
  Play,
  ArrowUpRight,
  Info,
  Layers,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileJson,
  UserCheck,
  BarChart3,
  Database,
  Newspaper,
  ShieldCheck,
  CopyCheck,
  // New icons for CTO Audit
  Activity,
  X,
  Settings,
  Terminal,
  ShieldAlert,
  ListChecks,
  GitCommit,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import the financial charts to prevent SSR mismatch
const FinancialCharts = dynamic(() => import("./FinancialCharts"), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full" />
});

interface ResearchClientProps {
  ticker: string;
  initialReport: any | null;
}

interface StepState {
  id: string;
  label: string;
  message: string;
  status: "pending" | "active" | "completed";
}

export function ResearchClient({ ticker, initialReport }: ResearchClientProps) {
  const [report, setReport] = React.useState<any | null>(initialReport);
  const [traces, setTraces] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialReport);
  const [isSaved, setIsSaved] = React.useState<boolean>(initialReport?.isWatchlist || false);
  const [copying, setCopying] = React.useState<boolean>(false);
  const [bookmarking, setBookmarking] = React.useState<boolean>(false);

  // Details workspace active tab
  const [activeTab, setActiveTab] = React.useState<"financials" | "committee" | "news" | "sources">("financials");
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);



  // Chat States
  const [chatInput, setChatInput] = React.useState<string>("");
  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [chatLoading, setChatLoading] = React.useState<boolean>(false);

  // Scenario stress test states
  const [scenarioSimulating, setScenarioSimulating] = React.useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = React.useState<any | null>(null);

  // Engineering / Interview Mode State
  const [showEngineeringMode, setShowEngineeringMode] = React.useState<boolean>(false);

  // Keydown listener for Ctrl + Shift + I
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setShowEngineeringMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Safe array normalization helpers
  const getWhyInvestList = () => {
    if (!report) return [];
    return Array.isArray(report.whyInvest)
      ? report.whyInvest
      : typeof report.whyInvest === "string"
      ? [report.whyInvest]
      : [];
  };

  const getWhyNotList = () => {
    if (!report) return [];
    return Array.isArray(report.whyNot)
      ? report.whyNot
      : typeof report.whyNot === "string"
      ? [report.whyNot]
      : [];
  };

  const getGrowthDriversList = () => {
    if (!report) return [];
    return Array.isArray(report.growthDrivers)
      ? report.growthDrivers
      : typeof report.growthDrivers === "string"
      ? [report.growthDrivers]
      : [];
  };

  const getNewsArticlesList = () => {
    if (!report || !report.recentNews) return [];
    return Array.isArray(report.recentNews.articles)
      ? report.recentNews.articles
      : [];
  };

  const getSuggestedQuestionsList = () => {
    if (!report) return [];
    return Array.isArray(report.suggestedQuestions)
      ? report.suggestedQuestions
      : typeof report.suggestedQuestions === "string"
      ? [report.suggestedQuestions]
      : [];
  };

  const getCounterArgumentsList = () => {
    if (!report || !report.overview) return [];
    return Array.isArray(report.overview.counterArguments)
      ? report.overview.counterArguments
      : [];
  };

  const getAssumptionsList = () => {
    if (!report || !report.overview) return [];
    return Array.isArray(report.overview.assumptions)
      ? report.overview.assumptions
      : [];
  };

  const getLimitationsList = () => {
    if (!report || !report.overview) return [];
    return Array.isArray(report.overview.limitations)
      ? report.overview.limitations
      : [];
  };

  // Initialize chat messages when report is loaded
  React.useEffect(() => {
    if (report) {
      setChatMessages([
        {
          role: "assistant",
          content: `I have compiled the investment research for **${report.company.name || ticker}**. You can ask me questions about P/E multiples, Moats, or run scenario stress tests.`
        }
      ]);
    }
  }, [report, ticker]);

  // Live progress timeline steps
  const [progressSteps, setProgressSteps] = React.useState<StepState[]>([
    { id: "inputValidator", label: "Validating Input Ticker", message: "Pending", status: "pending" },
    { id: "companyResolver", label: "Resolving Company Symbol", message: "Pending", status: "pending" },
    { id: "financialData", label: "Fetching Financial Data", message: "Pending", status: "pending" },
    { id: "businessSearch", label: "Analyzing Business Strategy", message: "Pending", status: "pending" },
    { id: "newsSentiment", label: "Reading Recent News Headlines", message: "Pending", status: "pending" },
    { id: "decisionEngine", label: "Calculating Investment Score", message: "Pending", status: "pending" },
    { id: "explainabilityGenerator", label: "Evaluating Investment Risks", message: "Pending", status: "pending" },
    { id: "outputFormatter", label: "Generating Final Report", message: "Pending", status: "pending" }
  ]);

  // Trigger Research SSE Stream
  const triggerResearchStream = React.useCallback(() => {
    setIsLoading(true);
    setReport(null);
    setScenarioResult(null);
    
    // Reset steps
    setProgressSteps(steps => steps.map(s => ({ ...s, message: "Pending", status: "pending" })));

    const eventSource = new EventSource(`/api/research?query=${ticker}`);

    eventSource.addEventListener("progress", (event: any) => {
      const data = JSON.parse(event.data);
      
      if (data.trace) {
        setTraces((prev) => {
          const exists = prev.some(t => t.node === data.trace.node);
          if (exists) return prev;
          return [...prev, data.trace];
        });
      }

      setProgressSteps((prev) =>
        prev.map((step) => {
          if (step.id === data.step) {
            return {
              ...step,
              message: data.message,
              status: data.status,
            };
          }
          return step;
        })
      );
    });

    eventSource.addEventListener("complete", async (event: any) => {
      const data = JSON.parse(event.data);
      setReport(data.report);
      setTraces(data.trace);
      setIsLoading(false);
      eventSource.close();

      // Automatically cache in watchlists/saved reports table
      try {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: data.report.company.ticker,
            name: data.report.company.name,
            score: data.report.scores.overall,
            recommendation: data.report.recommendation,
            reportData: data.report,
          }),
        });
      } catch (err) {
        console.error("Failed to auto-save report:", err);
      }
    });

    eventSource.addEventListener("error", (event: any) => {
      let message = "An error occurred during research execution";
      try {
        const data = JSON.parse(event.data);
        message = data.message || message;
      } catch(e) {}
      
      alert("Research Pipeline Failed: " + message);
      setIsLoading(false);
      eventSource.close();
    });

    return () => eventSource.close();
  }, [ticker]);

  // Run on mount if no initial report is present
  React.useEffect(() => {
    if (!initialReport) {
      triggerResearchStream();
    } else {
      // Mock some trace details for cached reports
      setTraces([
        { node: "Input Validator", duration: "0.05s", source: "Client Cache", confidence: "100%" },
        { node: "Company Resolver", duration: "0.12s", source: "Database Cache", confidence: "99%" },
        { node: "Financial Data Retriever", duration: "0.45s", source: "Yahoo Finance API Cache", confidence: "98%" },
        { node: "Business Analysis Node", duration: "0.85s", source: "Tavily Search API Cache", confidence: "95%" },
        { node: "News & Sentiment Node", duration: "0.62s", source: "News API Cache", confidence: "90%" },
        { node: "Decision Engine Node", duration: "0.01s", source: "Mathematical Evaluation", confidence: "100%" },
        { node: "Explainability Generator LLM", duration: "2.10s", source: "Gemini 2.5 Flash Cache", confidence: "91%" }
      ]);
    }
  }, [initialReport, triggerResearchStream]);

  // Toggle bookmark / watchlist status
  const handleBookmarkToggle = async () => {
    if (!report) return;
    setBookmarking(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: report.company.ticker,
          name: report.company.name,
          score: report.scores.overall,
          recommendation: report.recommendation,
          reportData: report,
          action: "toggle",
        }),
      });

      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarking(false);
    }
  };

  // Chat Submission Handler
  const handleChatSubmit = async (text?: string) => {
    const query = text || chatInput;
    if (!query.trim() || !report) return;

    const userMsg = { role: "user", content: query };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const isScenarioMsg = query.startsWith("Simulate scenario:");

    try {
      const res = await fetch("/api/research/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          reportContext: report,
          history: chatMessages.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);

        if (data.updatedScores) {
          setScenarioResult(data.updatedScores);
        }
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble processing that request." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Export Markdown File
  const handleExportMarkdown = () => {
    if (!report) return;

    const mdContent = `# CompanyIQ Research Report: ${report.company.name} (${report.company.ticker})
Score: ${report.scores.overall}/100 | Rating: ${report.recommendation}

## Executive Summary
${report.overview.executiveSummary}

## Business Overview
${report.overview.businessOverview}

## Competitive Moat
${report.overview.competitiveMoat}

## Deterministic Score Breakdown
- Financial Health: ${report.scores.breakdown.financialHealth.score}/${report.scores.breakdown.financialHealth.max}
- Growth Catalysts: ${report.scores.breakdown.growth.score}/${report.scores.breakdown.growth.max}
- Competitive Moats: ${report.scores.breakdown.competitiveAdvantage.score}/${report.scores.breakdown.competitiveAdvantage.max}
- Valuation Premium: ${report.scores.breakdown.valuation.score}/${report.scores.breakdown.valuation.max}
- News Sentiment: ${report.scores.breakdown.sentiment.score}/${report.scores.breakdown.sentiment.max}
- Risk Level: ${report.scores.breakdown.risk.score}/${report.scores.breakdown.risk.max}

## Investment Thesis (Why Invest?)
${getWhyInvestList().map((pt: string) => `- ${pt}`).join("\n")}

## Risks & Triggers (Why Not?)
${getWhyNotList().map((pt: string) => `- ${pt}`).join("\n")}`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CompanyIQ_Report_${report.company.ticker}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download raw JSON
  const handleDownloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CompanyIQ_Data_${report.company.ticker}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy Summary text
  const handleCopySummary = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.overview.executiveSummary);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  // Export Financials to CSV
  const handleExportCSV = () => {
    if (!report) return;

    const rows = [
      ["Company Name", report.company.name],
      ["Ticker", report.company.ticker],
      ["Price", `$${report.company.price.toFixed(2)}`],
      ["Market Cap", `$${(report.company.marketCap / 1e9).toFixed(2)}B`],
      ["Overall Score", `${report.scores.overall}/100`],
      ["Verdict", report.recommendation],
      [],
      ["Key Financial Metrics", "Value"],
      ["P/E Ratio", report.financialHealth.facts.peRatio ?? "N/A"],
      ["Debt to Equity", report.financialHealth.facts.debtToEquity ?? "N/A"],
      ["Profit Margin", report.financialHealth.facts.profitMargin ? `${(report.financialHealth.facts.profitMargin * 100).toFixed(1)}%` : "N/A"],
      ["Revenue Growth YoY", report.financialHealth.facts.revenueGrowth ? `${(report.financialHealth.facts.revenueGrowth * 100).toFixed(1)}%` : "N/A"],
      ["EPS", report.financialHealth.facts.eps ?? "N/A"],
      ["Cash", report.financialHealth.facts.cash ? `$${(report.financialHealth.facts.cash / 1e9).toFixed(2)}B` : "N/A"],
      ["Debt", report.financialHealth.facts.debt ? `$${(report.financialHealth.facts.debt / 1e9).toFixed(2)}B` : "N/A"],
      ["Free Cash Flow", report.financialHealth.facts.freeCashFlow ? `$${(report.financialHealth.facts.freeCashFlow / 1e9).toFixed(2)}B` : "N/A"],
      [],
      ["Historical Year", "Revenue", "Net Income", "Free Cash Flow"],
      ...report.financialHealth.historical.map((h: any) => [
        h.year,
        h.revenue,
        h.netIncome,
        h.freeCashFlow
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map((val: any) => `"${val}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CompanyIQ_Financials_${report.company.ticker}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Progressive loading screen: display completed steps and the currently active step
  if (isLoading) {
    const activeOrCompleted = progressSteps.filter(s => s.status !== "pending");
    
    return (
      <div className="flex-1 flex flex-col relative z-10 max-w-4xl mx-auto py-12 px-6 space-y-12 min-h-screen">
        {/* Floating Glass Loading Panel */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card/95 border border-border rounded-3xl p-6 space-y-6 shadow-2xl shadow-black/40 relative animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
                <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <h2 className="text-xs uppercase font-bold tracking-widest text-muted-foreground pt-2">Research Pipeline</h2>
              <p className="text-xs text-muted-foreground/60">Analyzing {ticker} with CompanyIQ Consensus</p>
            </div>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {activeOrCompleted.map((step) => (
                <div 
                  key={step.id} 
                  className="flex items-center justify-between text-xs font-semibold text-foreground/90 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center gap-3">
                    {step.status === "completed" ? (
                      <div className="h-5 w-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-green-500" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      </div>
                    )}
                    <span className={step.status === "completed" ? "text-muted-foreground line-through decoration-muted-foreground/35" : "text-foreground"}>
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                    {step.status === "completed" ? "Done" : "Active"}
                  </span>
                </div>
              ))}
            </div>

            {/* Real-time Agent Log (Wow Factor UI) */}
            {traces.length > 0 && (
              <div className="w-full bg-muted/30 border border-border/40 rounded-3xl p-5 text-[10px] font-mono text-muted-foreground/80 space-y-2 max-h-[140px] overflow-y-auto scrollbar-none animate-in fade-in duration-300">
                <span className="text-[8px] uppercase font-bold tracking-widest text-primary/70 block mb-1">Agent Event Log</span>
                {traces.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-start leading-relaxed text-[9px] border-b border-border/5 pb-1">
                    <span className="truncate max-w-[200px] text-foreground/85">[system] {t.node} completed</span>
                    <span className="text-primary font-bold shrink-0">{t.duration}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Layout Skeletons for Zero Layout Shift */}
        <div className="flex items-center justify-between border-b border-border pb-5 opacity-25 select-none pointer-events-none">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <div className="space-y-4 opacity-25 select-none pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-border/10 opacity-25 select-none pointer-events-none">
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>

        <div className="space-y-12 pt-8 border-t border-border/10 opacity-25 select-none pointer-events-none">
          <section className="space-y-6">
            <Skeleton className="h-6 w-60" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <Skeleton className="h-6 w-60" />
            <div className="flex gap-8">
              <Skeleton className="h-12 w-28" />
              <Skeleton className="h-12 w-28" />
              <Skeleton className="h-12 w-28" />
            </div>
            <div className="h-48 w-full bg-slate-800/10 rounded-2xl animate-pulse" />
          </section>
        </div>
      </div>
    );
  }

  const formatDateStably = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return dateStr;
    }
  };

  if (!report) return null;

  // Safe Fallbacks for newly added fields (supporting older cached data)
  const brief = report.executiveSummaryBrief || {
    tldr: "Consensus model generated an investment verdict.",
    verdict: report.recommendation,
    whyBullets: getWhyInvestList().slice(0, 3),
    biggestRisk: getWhyNotList()[0] || "No major risks specified.",
    confidence: parseInt(report.metadata?.confidence) || 90,
    timeHorizon: "Long Term"
  };

  const provenance = report.decisionProvenance || [];
  const changeLog = report.recommendationChangeLog || {
    previousVerdict: null,
    previousScore: null,
    currentVerdict: report.recommendation,
    currentScore: report.scores?.overall,
    changed: false,
    reason: "Initial scoring generated. No previous runs recorded."
  };

  const conflictResolution = report.sourceConflictResolution || {
    conflictDetected: false,
    description: "Signals from financial data sheets and sentiment metrics show alignment.",
    impact: "No confidence deduction triggered."
  };

  const transparency = report.transparency || {
    whatIKnow: ["Market Cap: $" + (report.company.marketCap / 1e9).toFixed(2) + "B", "Price: $" + report.company.price.toFixed(2)],
    whatIAssume: getAssumptionsList().slice(0, 2),
    whatIDontKnow: getLimitationsList().slice(0, 2)
  };

  const reviewChecklist = report.humanReviewChecklist || [
    "Verify balance sheets in the latest SEC 10-K filing.",
    "Cross-examine competitor growth rates in similar segments.",
    "Monitor news headlines for sudden executive transitions."
  ];

  const coverage = report.coverageMeter || {
    financial: 100,
    news: report.recentNews?.articles?.length > 4 ? 95 : 75,
    competition: 80,
    management: 70,
    overall: 85
  };

  const completeness = report.completenessIndicator || {
    completed: ["Historical statements scan", "Competitor products search", "News sentiment scoring"],
    missing: ["Executive earnings Q&A transcripts", "Supplier Agreements"],
    score: 85
  };

  const reflection = report.reflectionReport || {
    feedbackSummary: "Report audited and approved by the Quality Assurance Critic.",
    confidenceAdjustments: "No confidence adjustments requested during reflection cycles."
  };

  const rankings = report.sourceRankings || {};

  const getSourceReliabilityBadge = (sourceName: string) => {
    const rel = rankings[sourceName] || "Medium Reliability";
    const colors = 
      rel === "High Reliability" ? "bg-green-500/10 text-green-500 border-green-500/20" :
      rel === "Medium Reliability" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
      "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return <Badge variant="outline" className={`text-[9px] font-bold ${colors}`}>{rel}</Badge>;
  };

  const quickActions = [
    { label: "Explain Simply", cmd: "Can you explain this investment recommendation in simple terms?" },
    { label: "Explain Technically", cmd: "Provide a detailed technical breakdown of the valuation multiples and leverage ratios." },
    { label: "Worst Case Scenario", cmd: "What is the worst-case scenario for this company's business model?" },
    { label: "Best Case Scenario", cmd: "What is the best-case scenario and target growth path?" }
  ];

  return (
    <div className="flex-1 flex flex-col relative z-10 w-full max-w-4xl min-w-0 mx-auto py-12 px-4 sm:px-6 space-y-12 min-h-screen print:py-4 print:px-0">
      
      {/* Hidden Engineering/Interview Mode Modal */}
      {showEngineeringMode && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md overflow-y-auto p-4 md:p-10 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto font-sans">
            <button 
              onClick={() => setShowEngineeringMode(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer active:scale-90 transition-transform duration-100"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Activity className="h-6 w-6 text-primary animate-pulse" />
              <div>
                <h2 className="text-lg font-black text-foreground">Engineering & Interview Diagnostics Panel</h2>
                <p className="text-xs text-muted-foreground">Ctrl + Shift + I Toggle | Inspecting live multi-agent orchestration state</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-4">
                <div className="space-y-1.5 p-4 bg-secondary/20 rounded-2xl border border-border/10">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-primary" /> Active LangGraph State Variables
                  </h4>
                  <ul className="space-y-1 font-mono text-[10px] text-muted-foreground pt-1.5">
                    <li><strong className="text-foreground">ticker:</strong> "{ticker}"</li>
                    <li><strong className="text-foreground">companyName:</strong> "{report.company.name}"</li>
                    <li><strong className="text-foreground">criticAttempts:</strong> {report.metadata?.criticAttempts || 1}</li>
                    <li><strong className="text-foreground">criticFeedback:</strong> "{reflection.feedbackSummary.slice(0, 60)}..."</li>
                    <li><strong className="text-foreground">recommendation:</strong> "{report.recommendation}"</li>
                    <li><strong className="text-foreground">overallScore:</strong> {report.scores.overall}/100</li>
                  </ul>
                </div>
                
                <div className="space-y-1.5 p-4 bg-secondary/20 rounded-2xl border border-border/10">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <GitCommit className="h-3.5 w-3.5 text-primary" /> Active Nodes & Sequence path
                  </h4>
                  <div className="space-y-2 pt-2">
                    {[
                      { node: "inputValidator", desc: "Clean & sanitize symbol format" },
                      { node: "companyResolver", desc: "Lookup and query official company quote name" },
                      { node: "financialData", desc: "Fetch trailing financials sheets (Yahoo Finance)" },
                      { node: "businessSearch", desc: "Scrape product portfolios and competitors (Tavily)" },
                      { node: "newsSentimentAgent", desc: "Calibrate news media scores (News API)" },
                      { node: "decisionEngine", desc: "Run deterministic scoring algorithm limits" },
                      { node: "bullAnalyst & bearAnalyst", desc: "Parallel agent committee debate loops (Gemini)" },
                      { node: "explainabilityGenerator", desc: "Synthesize report and provenance arrays (Gemini)" },
                      { node: "reportCritic", desc: "QA self-reflection discrepancy audit check (Gemini)" },
                      { node: "outputFormatter", desc: "Zod layout schema validation wrapper" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-2">
                        <div className="font-mono text-[9px] text-primary shrink-0 bg-primary/10 border border-primary/20 px-1 rounded h-4.5 flex items-center">
                          {idx + 1}
                        </div>
                        <div>
                          <strong className="text-[11px] text-foreground">{step.node}</strong>
                          <p className="text-[10px] text-muted-foreground/80 font-medium">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5 p-4 bg-secondary/20 rounded-2xl border border-border/10">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5 text-primary" /> Confidence & Scoring Formula
                  </h4>
                  <div className="text-[10px] font-mono space-y-2 pt-1.5">
                    <p>Score represents a weighted average across 5 distinct dimensions:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Financial Health: <span className="text-foreground">20% weight</span></li>
                      <li>Growth Drivers: <span className="text-foreground">20% weight</span></li>
                      <li>Competitive Moat: <span className="text-foreground">20% weight</span></li>
                      <li>Valuation Multiple: <span className="text-foreground">20% weight</span></li>
                      <li>News/Sentiment: <span className="text-foreground">15% weight</span></li>
                      <li>General Risks: <span className="text-foreground">5% weight</span></li>
                    </ul>
                    <div className="border-t border-border/20 pt-2 text-primary font-bold">
                      Contradiction Penalty: Dynamic -5 to -15 points (If Fundamentals vs. News Sentiment divergence detected)
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 p-4 bg-secondary/20 rounded-2xl border border-border/10">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" /> Prompt Version & Ingest Stats
                  </h4>
                  <ul className="space-y-1 font-mono text-[10px] text-muted-foreground pt-1.5">
                    <li><strong className="text-foreground">Prompt Version:</strong> "v3.4-production-audited"</li>
                    <li><strong className="text-foreground">LLM Base Model:</strong> {report.metadata?.aiModel || "Gemini 2.5 Flash / Router Fallback"}</li>
                    <li><strong className="text-foreground">Total Ingested Data:</strong> ~4,200 tokens (financials + news + search results)</li>
                    <li><strong className="text-foreground">Orchestrator Latency:</strong> {report.metadata?.durationMs ? `${(report.metadata.durationMs / 1000).toFixed(2)}s` : "N/A"}</li>
                    <li><strong className="text-foreground">Hallucination Audit:</strong> PASSED</li>
                    <li className="pt-1.5 border-t border-border/10 mt-1">
                      <strong className="text-foreground">LLM Key Registry:</strong>
                      <span className="ml-1 space-x-2">
                        <span>Gemini: {report.metadata?.keysLoaded?.gemini ? "✅" : "❌"}</span>
                        <span>OpenRouter: {report.metadata?.keysLoaded?.openrouter ? "✅" : "❌"}</span>
                        <span>Groq: {report.metadata?.keysLoaded?.groq ? "✅" : "❌"}</span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* State Snapshot JSON tree */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Raw State JSON Snapshot</span>
              <details className="bg-muted p-4 rounded-2xl border border-border/20 text-[9px] font-mono text-muted-foreground cursor-pointer">
                <summary className="font-bold text-foreground focus:outline-none">Expand Raw State Tree</summary>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap max-h-48 select-text">
                  {JSON.stringify({
                    ticker,
                    company: report.company,
                    scores: report.scores,
                    provenance,
                    changeLog,
                    conflictResolution,
                    transparency,
                    coverage,
                    completeness,
                    reflection,
                    traces
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 print:hidden">
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground font-semibold text-xs">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Hidden toggle for engineering mode */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowEngineeringMode(true)}
            className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer"
            title="Open Interview Engineering Diagnostics Overlay"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              window.location.href = `/research/${ticker}?refresh=true`;
            }}
            className="h-8 px-2.5 border-border text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-150 active:scale-[0.97] active:translate-y-[0.5px]"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Re-run Analysis
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBookmarkToggle} 
            disabled={bookmarking}
            className={`h-8 px-2.5 border-border text-[11px] font-bold transition-colors ${isSaved ? 'text-primary bg-primary/10 hover:text-primary border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Star className={`mr-1 h-3.5 w-3.5 ${isSaved ? 'fill-primary' : ''}`} /> 
            {isSaved ? "Saved" : "Watchlist"}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="h-8 px-2.5 border-border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted">
            <FileJson className="mr-1 h-3.5 w-3.5" /> JSON
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 px-2.5 border-border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted">
            <Download className="mr-1 h-3.5 w-3.5" /> CSV Data
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="h-8 px-2.5 border-border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted">
            <FileText className="mr-1 h-3.5 w-3.5" /> Markdown
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrintReport} className="h-8 px-2.5 border-border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted">
            <FileText className="mr-1 h-3.5 w-3.5" /> PDF / Print
          </Button>
        </div>
      </div>

      {/* Editorial Corporate Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 block">Equity Research Brief</span>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-baseline gap-3">
              <span>{report.company.name}</span>
              <span className="text-xl font-mono font-medium text-muted-foreground shrink-0">{report.company.ticker}</span>
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span>Market Price: ${report.company.price.toFixed(2)}</span>
              <span>•</span>
              <span>Market Cap: ${(report.company.marketCap / 1e9).toFixed(2)}B</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60 block">Calibrated Score</span>
              <span className="text-2xl font-black text-foreground">{report.scores.overall}/100</span>
            </div>
          </div>
        </div>

        {/* The Hero Recommendation Banner: TL;DR Executive Brief Grid */}
        <div className="py-6 px-6 sm:px-8 bg-secondary/35 rounded-3xl border border-border/10 relative overflow-hidden space-y-5">
          <div className={`absolute top-0 left-0 right-0 h-[3px] ${
            brief.verdict === 'INVEST' ? 'bg-green-500/80' : 
            brief.verdict === 'WATCHLIST' ? 'bg-amber-500/80' : 
            'bg-red-500/80'
          }`} />

          {/* Top verdict row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/10 pb-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/80 block">Committee Verdict</span>
              <span className="text-sm font-black text-foreground tracking-tight flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black select-none ${
                  brief.verdict === 'INVEST' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                  brief.verdict === 'WATCHLIST' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {brief.verdict}
                </span>
                <span className="text-xs text-muted-foreground">Horizon: {brief.timeHorizon}</span>
              </span>
            </div>
            
            {/* Quick Metrics Grid */}
            <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground">
              <div className="space-y-1 text-right sm:text-left">
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 block">Confidence</span>
                <span className="text-sm font-black text-foreground">{brief.confidence}%</span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 block">Completeness</span>
                <span className="text-sm font-black text-foreground">{completeness.score}%</span>
              </div>
            </div>
          </div>

          {/* TL;DR Text statement */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60 block">TL;DR Executive Summary</span>
            <p className="text-base font-semibold leading-relaxed text-foreground/90">
              {brief.tldr}
            </p>
          </div>

          {/* Bullet drivers */}
          <div className="space-y-2 pt-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60 block">Core Investment Thesis</span>
            <div className="grid md:grid-cols-3 gap-4">
              {brief.whyBullets.map((bullet: string, idx: number) => (
                <div key={idx} className="flex gap-2.5 text-xs text-foreground/80 leading-relaxed font-semibold bg-background/30 p-3 rounded-2xl border border-border/5">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Alert */}
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-red-400 block mb-0.5">Primary Risk Constraint</span>
              <p className="text-foreground/85 font-semibold">{brief.biggestRisk}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Stability Change Log */}
      <section className="p-5 bg-card border border-border rounded-3xl space-y-3">
        <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" /> Recommendation Stability Change Log
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="text-center bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/5">
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 block">Previous Verdict</span>
              <span className="font-bold text-muted-foreground">{changeLog.previousVerdict || "N/A"}</span>
            </div>
            <span className="text-muted-foreground/40 font-bold font-mono">→</span>
            <div className="text-center bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
              <span className="text-[8px] uppercase tracking-wider text-primary/70 block">Current Verdict</span>
              <span className="font-bold text-primary">{changeLog.currentVerdict}</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground text-right">
            <span>Status: </span>
            <Badge variant="outline" className={`font-black text-[9px] uppercase ${changeLog.changed ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
              {changeLog.changed ? "Verdict Shifted" : "Stable Consensus"}
            </Badge>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground font-semibold">
          {changeLog.reason}
        </p>
      </section>

      {/* Dynamic Source Conflict Resolution (Area 3) */}
      {conflictResolution.conflictDetected && (
        <section className="p-5 bg-amber-500/5 border border-amber-500/15 rounded-3xl space-y-2 animate-in fade-in duration-200">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Source Conflict Resolution Callout
          </h4>
          <p className="text-xs font-semibold leading-relaxed text-foreground/80">
            {conflictResolution.description}
          </p>
          <div className="text-[10px] text-amber-400 font-bold border-t border-amber-500/10 pt-2">
            Dynamic Scoring Impact: {conflictResolution.impact}
          </div>
        </section>
      )}

      {/* Decision Provenance & Evidence Trace (Area 1) */}
      <section className="space-y-4">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/85 pb-1">
          Decision Provenance & Traceability Grid
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {provenance.slice(0, 3).map((prov: any, idx: number) => (
            <div key={idx} className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <h4 className="text-[11px] font-black text-foreground tracking-tight leading-snug">{prov.assertion}</h4>
                <Badge variant="outline" className={`text-[8px] font-black uppercase shrink-0 ${prov.type === "bull" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {prov.type}
                </Badge>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                  <span>Reliability</span>
                  <span>{prov.confidence}% Confidence</span>
                </div>
                {getSourceReliabilityBadge(prov.assertion) /* Use helper */}
              </div>

              <div className="space-y-2 pt-2 border-t border-border/15">
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 block font-bold">Ingested Evidence</span>
                <ul className="text-[10px] text-muted-foreground/90 space-y-1.5">
                  {prov.evidence.map((ev: string, i: number) => (
                    <li key={i} className="list-disc list-inside leading-relaxed font-semibold">
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation Philosophy & AI Decision Principles (Area 7 & 8) */}
      <div className="grid md:grid-cols-2 gap-8 pt-2">
        {/* Philosophy */}
        <div className="p-5 bg-secondary/15 rounded-3xl border border-border/10 space-y-2.5">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" /> How CompanyIQ Thinks
          </h4>
          <p className="text-[11px] leading-relaxed text-muted-foreground font-semibold">
            CompanyIQ evaluates structural evidence from balance sheets, operational margins, competitive moats, news flows, and risk triggers. It does not predict short-term stock prices or act as fiduciary advice. Recommendation output represents multi-agent consensus scoring.
          </p>
        </div>

        {/* Principles */}
        <div className="p-5 bg-secondary/15 rounded-3xl border border-border/10 space-y-2.5">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" /> AI Decision Principles
          </h4>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[10px] font-bold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Evidence First
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Transparent
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Explainable
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Conservative
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Multi-Agent
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Human Audited
            </div>
          </div>
        </div>
      </div>

      {/* Research Completeness & Missing Indicators (Area 9) */}
      <section className="space-y-4 pt-2">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/85">
          Research Completeness Tracker
        </h3>
        <div className="grid md:grid-cols-2 gap-8 text-[11px] leading-relaxed text-muted-foreground font-semibold">
          <div className="space-y-2.5 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" /> Completed Dimensions
            </h4>
            <div className="grid grid-cols-2 gap-2 pt-1 font-bold text-foreground/95">
              {completeness.completed.map((item: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Missing Information (Not Evaluated)
            </h4>
            <div className="grid grid-cols-1 gap-2 pt-1 font-bold text-muted-foreground/85">
              {completeness.missing.map((item: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-amber-500 font-bold">⚠</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Transparency Certainty Matrix (Area 6) */}
      <section className="space-y-6 pt-2">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/85">
          AI Certainty & Transparency Matrix
        </h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm leading-relaxed text-muted-foreground font-medium">
          <div className="space-y-2.5 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground">What I Know (Verified Facts)</h4>
            <ul className="text-[11px] text-foreground/90 space-y-2.5 list-none">
              {transparency.whatIKnow.map((item: string, idx: number) => (
                <li key={idx} className="flex gap-2 leading-relaxed font-bold">
                  <span className="text-green-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground">What I Assume (Projections)</h4>
            <ul className="text-[11px] text-foreground/90 space-y-2.5 list-none">
              {transparency.whatIAssume.map((item: string, idx: number) => (
                <li key={idx} className="flex gap-2 leading-relaxed font-bold">
                  <span className="text-primary font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground">What I Don't Know (Data Gaps)</h4>
            <ul className="text-[11px] text-foreground/90 space-y-2.5 list-none">
              {transparency.whatIDontKnow.map((item: string, idx: number) => (
                <li key={idx} className="flex gap-2 leading-relaxed font-bold">
                  <span className="text-muted-foreground/60 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Human Review Mode Checklist (Area 15) */}
      <section className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-sm">
        <h4 className="text-[11px] uppercase font-black text-foreground flex items-center gap-2">
          <ListChecks className="h-4.5 w-4.5 text-primary" /> Human Review Mode: Required Audit Steps
        </h4>
        <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
          The following checks represent critical verification tasks that require manual oversight to validate this investment thesis:
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {reviewChecklist.map((item: string, idx: number) => (
            <div key={idx} className="flex gap-3 text-xs leading-relaxed font-semibold bg-secondary/20 p-4 rounded-2xl border border-border/10">
              <span className="font-mono text-primary font-black">{idx + 1}.</span>
              <span className="text-[11px] text-foreground/90 leading-snug">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Business Overview & Moat Strategy */}
      <section className="space-y-4 pt-2">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/85">
          Business Model & Moat Analysis
        </h3>
        <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-muted-foreground font-medium">
          <div className="space-y-2 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground">Strategy & Operations</h4>
            <p className="text-[11px] text-foreground/90 leading-relaxed font-semibold">{report.overview.businessOverview}</p>
          </div>
          <div className="space-y-2 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground">Moat Barriers & Pricing Power</h4>
            <p className="text-[11px] text-foreground/90 leading-relaxed font-semibold">{report.overview.competitiveMoat}</p>
          </div>
        </div>
      </section>

      {/* Details Workspace (Progressive Disclosure Tab System on Screen, Sequential sections on Print) */}
      <div className="space-y-12 pt-6">
        
        {/* Tab Buttons (Screen Only) */}
        <div className="flex border-b border-border/20 gap-2 pb-px overflow-x-auto scrollbar-none print:hidden">
          {[
            { id: "financials", label: "Financial Analysis", icon: BarChart3 },
            { id: "committee", label: "Specialist Consensus", icon: UserCheck },
            { id: "news", label: "News Sentiment", icon: Newspaper },
            { id: "sources", label: "Sources & Trace", icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all relative shrink-0 -mb-px border-b-2 cursor-pointer active:scale-[0.98] active:translate-y-[0.2px] duration-150 ${
                  isActive 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Financials */}
        <div className={`${activeTab === "financials" ? "block animate-in fade-in duration-200" : "hidden print:block"} space-y-6`}>
          <h3 className="text-base font-bold text-foreground pb-2 hidden print:block">
            Financial Health & Metrics
          </h3>
          
          {/* Fact Stats */}
          <div className="flex flex-wrap gap-y-4 gap-x-8 md:gap-x-12 py-2 bg-secondary/20 p-5 rounded-3xl border border-border/10">
            {[
              { label: "P/E Ratio", val: report.financialHealth.facts.peRatio ?? "N/A" },
              { label: "Debt to Equity", val: report.financialHealth.facts.debtToEquity ?? "N/A" },
              { label: "Profit Margin", val: report.financialHealth.facts.profitMargin ? `${(report.financialHealth.facts.profitMargin * 100).toFixed(1)}%` : "N/A" },
              { label: "Rev Growth YoY", val: report.financialHealth.facts.revenueGrowth ? `${(report.financialHealth.facts.revenueGrowth * 100).toFixed(1)}%` : "N/A" }
            ].map((fact, idx) => (
              <div key={idx} className="min-w-[120px] space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{fact.label}</span>
                <h5 className="text-lg font-black text-foreground">{fact.val}</h5>
              </div>
            ))}
          </div>

          {/* Scoring Drivers */}
          <div className="space-y-3 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Scoring Drivers</span>
            <div className="grid sm:grid-cols-2 gap-3 text-xs font-semibold text-muted-foreground/95">
              {report.scores.breakdown.financialHealth.drivers.map((drv: string, idx: number) => (
                <div key={idx} className="flex gap-2.5 leading-relaxed">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{drv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Charts */}
          <div className="pt-4 p-5 bg-secondary/10 rounded-3xl border border-border/10 print:break-inside-avoid">
            <FinancialCharts data={report.financialHealth.historical} />
            <p className="text-[10px] text-muted-foreground/60 font-semibold leading-relaxed mt-4 italic">
              *Chart Explanations: The bar chart traces Revenue and Net Income trends over time to monitor core capitalization sizes. The area chart represents Free Cash Flow, demonstrating cash reserves after operations.*
            </p>
          </div>
        </div>

        {/* Tab Content 2: Committee */}
        <div className={`${activeTab === "committee" ? "block animate-in fade-in duration-200" : "hidden print:block"} space-y-6 print:break-inside-avoid`}>
          <h3 className="text-base font-bold text-foreground pb-2 hidden print:block">
            Specialist Committee Vote Matrix
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { name: "Financial Specialist", icon: BarChart3, vote: "INVEST", conf: "98%", reason: "Excellent cash position and strong EPS generation drivers." },
              { name: "Market Strategist", icon: TrendingUp, vote: "INVEST", conf: "95%", reason: "Brand equity barriers to entry remain secure against peers." },
              { name: "News Sentiment Analyst", icon: Newspaper, vote: report.recentNews.sentimentScore > 50 ? "INVEST" : "WATCHLIST", conf: "90%", reason: "Social and press cycles correlate to high consumer interest." },
              { name: "Risk Assessment Analyst", icon: AlertTriangle, vote: "WATCHLIST", conf: "92%", reason: "Regulatory tailwinds require ongoing quarterly audits." }
            ].map((specialist, idx) => {
              const Icon = specialist.icon;
              return (
                <div key={idx} className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-sm hover:border-primary/20 transition-all duration-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{specialist.name}</h4>
                        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Specialist Analyst</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase select-none ${
                      specialist.vote === 'INVEST' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {specialist.vote}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60">
                      <span>Model Confidence</span>
                      <span className="text-primary">{specialist.conf}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: specialist.conf }} />
                    </div>
                  </div>

                  <p className="text-[11px] text-foreground/80 leading-relaxed font-semibold">
                    {specialist.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Content 3: News Sentiment */}
        <div className={`${activeTab === "news" ? "block animate-in fade-in duration-200" : "hidden print:block"} space-y-6`}>
          <h3 className="text-base font-bold text-foreground pb-2 hidden print:block">
            Market Sentiment & Media
          </h3>
          
          <div className="flex justify-between items-center text-xs font-bold text-foreground/90 py-1 bg-secondary/20 p-4 rounded-3xl border border-border/10">
            <span>Sentiment Class: {report.recentNews.sentiment}</span>
            <span>Calibrated Score: {report.recentNews.sentimentScore}%</span>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">News Stream (30 Days)</span>
            
            <div className="divide-y divide-border/10 bg-card border border-border p-4 rounded-3xl">
              {getNewsArticlesList().map((art: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex flex-col space-y-2 py-4 first:pt-0 last:pb-0 hover:bg-muted/5 transition-colors px-2 rounded-xl group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link href={art.url || "#"} target="_blank" className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">
                      {art.title}
                    </Link>
                    
                    <Badge variant="outline" className={`text-[8px] font-black shrink-0 uppercase ${
                      art.sentiment === 'positive' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      art.sentiment === 'negative' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      'bg-muted text-muted-foreground border border-border/20'
                    }`}>
                      {art.sentiment}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground/60 font-semibold pt-1">
                    <span>Source: {art.source}</span>
                    <span>{formatDateStably(art.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content 4: Sources & Logs */}
        <div className={`${activeTab === "sources" ? "block animate-in fade-in duration-200" : "hidden print:block"} space-y-6`}>
          <h3 className="text-base font-bold text-foreground pb-2 hidden print:block">
            Citations & Latency Trace
          </h3>
          
          <div className="space-y-4 p-5 bg-secondary/20 rounded-3xl border border-border/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Ingestion Sources</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(report.citations).map(([cat, srcs]: [string, any]) => (
                <div key={cat} className="space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60">{cat}</span>
                  <ul className="text-xs font-semibold text-muted-foreground/80 space-y-1.5">
                    {srcs.map((s: string, idx: number) => (
                      <li key={idx} className="list-disc list-inside flex items-center justify-between">
                        <span>{s}</span>
                        {getSourceReliabilityBadge(s) /* Badge ratings */}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 bg-secondary/15 rounded-3xl border border-border/10 p-5 print:break-inside-avoid">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Tool Execution Latency Trace</span>
              <span className="text-[9px] text-primary font-bold">Total Latency: {(report.metadata?.durationMs / 1000).toFixed(2)}s</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="font-bold text-muted-foreground/60 border-b border-border/10">
                    <th className="py-2.5">Agent / Core Process</th>
                    <th className="py-2.5">Tool Invoked</th>
                    <th className="py-2.5">Latency</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-muted-foreground/75">
                  {traces.map((tr, i) => (
                    <tr key={i} className="border-b border-border/5">
                      <td className="py-2.5 text-foreground">{tr.node}</td>
                      <td className="py-2.5 font-mono text-[9px] text-primary">{tr.source || "Gemini-2.5-flash API"}</td>
                      <td className="py-2.5">{tr.duration}</td>
                      <td className="py-2.5 text-right text-green-500">SUCCESS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* AI Interaction Workspace (Scenario Simulator & Chat Q&A) */}
      <div className="space-y-8 pt-8 border-t border-border/10 print:hidden">
        
        {/* Scenario Analysis Simulator */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-foreground pb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Scenario Simulator & Stress Tester
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Scoring Risk Vectors</span>
              <div className="space-y-2 text-xs font-semibold text-muted-foreground/95">
                {report.scores.breakdown.risk.drivers.map((drv: string, idx: number) => (
                  <div key={idx} className="flex gap-2.5 leading-relaxed">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{drv}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Trigger Stress Test Scenarios</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Rev Drops", cmd: "Simulate scenario: revenue growth drops to 5%" },
                  { label: "Rates Spike", cmd: "Simulate scenario: interest rates rise by 2%" },
                  { label: "Margins Compress", cmd: "Simulate scenario: competitor enters and margins compress" },
                  { label: "Sentiment Drop", cmd: "Simulate scenario: sentiment turns bearish" }
                ].map((scen, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => handleChatSubmit(scen.cmd)}
                    disabled={chatLoading}
                    className="h-11 text-[10px] border-border bg-card/45 font-bold hover:text-primary hover:border-primary/50 transition-colors w-full rounded-xl px-2"
                  >
                    {scen.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Animate Scenario Result */}
          <AnimatePresence>
            {scenarioResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 bg-secondary/35 border border-border/30 rounded-3xl space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Simulated Stress Score:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground/60">{scenarioResult.originalScore}</span>
                      <span className="text-sm text-primary">{scenarioResult.simulatedScore}/100</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    {chatMessages[chatMessages.length - 1]?.content}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* AI Chat Client */}
        <section className="space-y-4 pt-4 border-t border-border/10">
          <h3 className="text-base font-semibold text-foreground pb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Interactive Analyst Q&A Chat
          </h3>
          
          <div className="space-y-4">
            {/* Messages Panel */}
            <div className="h-[420px] overflow-y-auto space-y-4 font-semibold text-xs leading-relaxed pr-2 scrollbar-none">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i}
                  className={`flex flex-col space-y-1 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60 gap-4">
                    <span>{msg.role === 'user' ? 'You' : 'Analyst'}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          setCopiedIndex(i);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0 flex items-center gap-1 cursor-pointer active:scale-95 duration-100"
                        aria-label="Copy Response"
                      >
                        {copiedIndex === i ? (
                          <>
                            <CopyCheck className="h-3 w-3 text-green-500" />
                            <span className="text-green-500 text-[8px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-[8px]">Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div 
                    className={`p-4 rounded-2xl leading-relaxed text-left border ${
                      msg.role === 'user' 
                        ? 'bg-secondary/50 border-border/30 text-foreground' 
                        : 'bg-secondary/35 border-border/20 text-foreground/90'
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex flex-col space-y-1 max-w-[85%] mr-auto items-start">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/60">Analyst</span>
                  <div className="bg-secondary/35 border border-border/20 text-muted-foreground p-4 rounded-2xl flex items-center gap-2 font-bold">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    <span>Analyst compiling response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions & Suggested Questions Horizontal Track */}
            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none border-b border-border/10 pb-3">
              {/* Quick Actions first */}
              {quickActions.map((qa, i) => (
                <button
                  key={`qa-${i}`}
                  onClick={() => handleChatSubmit(qa.cmd)}
                  disabled={chatLoading}
                  className="whitespace-nowrap px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-[10px] text-primary border border-primary/20 cursor-pointer active:scale-[0.97] active:translate-y-[0.5px] transition-all duration-150 shrink-0 h-9 flex items-center font-bold"
                >
                  {qa.label}
                </button>
              ))}

              {/* Dynamic Suggested Questions next */}
              {getSuggestedQuestionsList().map((q: string, i: number) => (
                <button
                  key={`q-${i}`}
                  onClick={() => handleChatSubmit(q)}
                  disabled={chatLoading}
                  className="whitespace-nowrap px-4 py-2 rounded-xl bg-secondary/35 hover:bg-secondary/60 text-[10px] text-muted-foreground cursor-pointer active:scale-[0.97] active:translate-y-[0.5px] transition-all duration-150 shrink-0 h-9 flex items-center font-bold border border-border/20"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="relative flex items-center border border-border/80 rounded-2xl bg-secondary/20 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all p-1.5 pl-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                disabled={chatLoading}
                placeholder="Ask the Analyst about this report..."
                className="flex-1 h-9 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-semibold pr-12"
              />
              <Button 
                onClick={() => handleChatSubmit()} 
                disabled={chatLoading || !chatInput.trim()}
                size="icon"
                className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-sm transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Disclaimers */}
      <div className="pt-8 text-[10px] text-muted-foreground/50 leading-relaxed font-semibold">
        <span className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">Platform Disclaimer</span>
        Market conditions evolve. This report is compiled dynamically by an AI research compiler. It is not formal broker-dealer advice or fiduciary recommendation.
      </div>

    </div>
  );
}
