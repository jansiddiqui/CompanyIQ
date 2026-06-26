import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { 
  Layers, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  FileJson,
  PieChart,
  Settings,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ArchitecturePage() {
  const steps = [
    {
      id: "input",
      title: "Input Validator",
      type: "Ingestion",
      desc: "Sanitizes and filters queries to verify ticker symbols.",
      tech: "Regex, Zod Schema"
    },
    {
      id: "resolver",
      title: "Company Resolver",
      type: "Ingestion",
      desc: "Maps company queries to standard market exchanges.",
      tech: "Yahoo Ticker Lookup"
    },
    {
      id: "financial",
      title: "Financial Data Retriever",
      type: "Data Ingestion",
      desc: "Fetches balance sheets, cash flows, and multiples.",
      tech: "Yahoo Finance API"
    },
    {
      id: "business",
      title: "Business & Moat Search",
      type: "Data Ingestion",
      desc: "Scrapes business models, expansions, and peers.",
      tech: "Tavily Search API"
    },
    {
      id: "news",
      title: "News & Sentiment",
      type: "Data Ingestion",
      desc: "Collects news and scores positive/negative media ratios.",
      tech: "News API / Scrapers"
    },
    {
      id: "decision",
      title: "Deterministic Engine",
      type: "Core Math",
      desc: "Applies locked mathematical formulas to score metrics.",
      tech: "Locked Weight Algebra"
    },
    {
      id: "explain",
      title: "Explainability Gen",
      type: "AI Synthesis",
      desc: "Generates summaries, risk triggers, and maps citations.",
      tech: "Gemini 2.5 Flash"
    },
    {
      id: "output",
      title: "Output Formatter",
      type: "Assembly",
      desc: "Structures report into validated JSON formats.",
      tech: "Zod Schema Compiler"
    }
  ];

  const weights = [
    { category: "Financial Health", weight: "30%", color: "bg-primary", desc: "Debt-to-equity leverage, profit margins, and net cash metrics." },
    { category: "Growth Catalyst", weight: "25%", color: "bg-primary", desc: "YoY top-line revenue expansion and EPS trailing trends." },
    { category: "Competitive Moat", weight: "15%", color: "bg-primary", desc: "Margin profiles relative to sector benchmarks and brand moat." },
    { category: "Valuation Premium", weight: "10%", color: "bg-primary", desc: "P/E ratios, PEG multiples, and entry multiple assessments." },
    { category: "Public Sentiment", weight: "10%", color: "bg-primary", desc: "Weighted positive vs. negative news coverage over last 30 days." },
    { category: "Risk Buffer", weight: "10%", color: "bg-primary", desc: "FCF liquidity triggers, solvency metrics, and regulatory tailwinds." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Platform Architecture
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              InvestIQ AI relies on a modular, explainable multi-stage workflow. We separate deterministic math modeling from AI reasoning to provide trustworthy investment summaries.
            </p>
          </div>

          {/* Interactive Graph Layout */}
          <Card className="bg-card/45 border-border rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" /> LangGraph Workflow Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
                {steps.map((step, idx) => (
                  <div 
                    key={step.id} 
                    className="p-4 rounded-2xl border border-border bg-card/60 flex flex-col justify-between space-y-3 relative group hover:border-border/80 transition-all duration-300 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">{step.type}</span>
                      <span className="text-xs font-bold text-muted-foreground/45">0{idx + 1}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{step.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-border/25 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground/60">Engine</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-xl border border-border/40">{step.tech}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-xs text-muted-foreground leading-relaxed flex gap-3 shadow-sm">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Technical Rationale:</strong> The pipeline is designed sequentially to ensure that data ingestion is completed *prior* to LLM summarization. This eliminates hallucination since the LLM is restricted to analyzing the structured variables fetched and computed in previous nodes.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Decision Engine weights */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Deterministic Weights */}
            <Card className="bg-card/45 border-border rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> Decision Engine Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We calculate a deterministic rating (0 to 100) before triggering the explainability agent. The scoring breakdown uses the following mathematical weights:
                </p>
                <div className="space-y-3">
                  {weights.map((w) => (
                    <div key={w.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground/90">{w.category}</span>
                        <span className="text-muted-foreground">{w.weight}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${w.color}`} style={{ width: w.weight }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ingestion & Security details */}
            <Card className="bg-card/45 border-border rounded-3xl flex flex-col justify-between shadow-sm">
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Core Trust Mechanisms
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">Fact / Opinion Separation</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quantitative multiples (PE, balance sheets, free cash flows) are rendered as raw immutable fact cards straight from the ticker lookup. AI summaries are clearly marked in their own sections.
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">Source Attribution per Section</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Rather than showing a single list of sources at the bottom, every card displays its specific data origin (e.g. Yahoo Finance for balance sheets, Tavily for competitive analysis).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">Scenario Analysis Engine</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Allows stress-testing the investment recommendation. When the user models interest rate changes or margin declines, the backend recalculates ratings deterministically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border/25 bg-muted/40 text-center">
                <Link href="/">
                  <Button variant="outline" size="sm" className="w-full font-semibold border-border bg-card hover:bg-muted rounded-xl">
                    Run Research Test
                  </Button>
                </Link>
              </div>
            </Card>

          </div>

        </div>
      </main>
    </div>
  );
}
