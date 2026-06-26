import Link from "next/link";
import { 
  TrendingUp, ArrowRight, ChevronRight, 
  Search, BarChart3, Newspaper, Brain, 
  ShieldCheck, GitMerge, Layers, Zap,
  CheckCircle, Database, Globe, Code2
} from "lucide-react";

// Static landing page - no auth, no DB calls
export default function LandingPage() {

  const pipelineSteps = [
    { icon: Search, label: "Search Company", desc: "Ticker resolution & validation", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Database, label: "Financial Analysis", desc: "Yahoo Finance • SEC filings", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: Globe, label: "Business Intelligence", desc: "Tavily deep web search", color: "text-violet-500", bg: "bg-violet-500/10" },
    { icon: Newspaper, label: "News Intelligence", desc: "Sentiment classification", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: TrendingUp, label: "Bull Analyst", desc: "Growth thesis construction", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: ShieldCheck, label: "Bear Analyst", desc: "Risk identification", color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: Brain, label: "Committee Discussion", desc: "Multi-agent deliberation", color: "text-primary", bg: "bg-primary/10" },
    { icon: GitMerge, label: "Reflection & Audit", desc: "QA critic validation", color: "text-rose-500", bg: "bg-rose-500/10" },
    { icon: CheckCircle, label: "Final Recommendation", desc: "INVEST · WATCHLIST · PASS", color: "text-emerald-600", bg: "bg-emerald-600/10" },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI Investment Committee",
      desc: "Multiple specialist AI agents deliberate independently before reaching a consensus recommendation."
    },
    {
      icon: ShieldCheck,
      title: "Evidence-Based Decisions",
      desc: "Every recommendation is backed by specific citations mapping to Yahoo Finance, SEC filings, and news sources."
    },
    {
      icon: Layers,
      title: "Transparent Reasoning",
      desc: "Decision provenance traces every thesis point to its source. No black-box outputs."
    },
    {
      icon: Zap,
      title: "Scenario Simulation",
      desc: "Stress-test investment theses against rate hikes, earnings misses, and regulatory events."
    },
    {
      icon: GitMerge,
      title: "Interactive Research Chat",
      desc: "Ask follow-up questions directly to the AI analyst. Deep-dive into any aspect of the report."
    },
    {
      icon: BarChart3,
      title: "Calibrated Confidence",
      desc: "Scores are calculated deterministically from financial metrics. The LLM explains, never decides."
    },
  ];

  const techStack = [
    { name: "Next.js 16", role: "App Framework" },
    { name: "LangGraph", role: "Agent Orchestration" },
    { name: "LangChain", role: "LLM Integration" },
    { name: "Prisma ORM", role: "Database Layer" },
    { name: "Gemini / Groq", role: "Language Models" },
    { name: "Yahoo Finance", role: "Financial Data" },
    { name: "Tavily Search", role: "Web Intelligence" },
    { name: "Framer Motion", role: "Animations" },
  ];

  const sampleReport = {
    company: "Apple Inc.",
    ticker: "AAPL",
    recommendation: "INVEST",
    score: 91,
    confidence: 92,
    coverage: 94,
    reasons: [
      "Industry-leading gross margins (46.2%) driven by premium ecosystem lock-in",
      "Services revenue growing at 14% YoY with structurally higher margins than hardware",
      "Strong cash generation ($29B FCF) supporting aggressive buyback program",
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="CompanyIQ Home">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all duration-300 shadow-sm shadow-primary/5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "How it Works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Technology", href: "#technology" },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              Start Research
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-12 pb-16 sm:pt-28 sm:pb-32 overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] bg-primary/4 rounded-full blur-[140px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI Investment Research Platform
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground tracking-tight leading-[0.95]">
                AI Investment<br />
                <span className="text-primary">Committee</span>
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed font-medium">
                CompanyIQ deploys a multi-agent AI system to research public companies. Multiple specialist analysts deliberate, validate each other&apos;s conclusions, and produce transparent, evidence-backed investment recommendations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
              <Link
                href="/signup"
                className="flex w-full sm:w-auto items-center justify-center gap-2 h-12 px-7 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
              >
                Start Research
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="flex w-full sm:w-auto items-center justify-center gap-2 h-12 px-7 rounded-2xl border border-border/60 bg-card/40 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-primary/3 transition-all"
              >
                Sign in
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground/50 font-medium">
              Free account · No credit card required · Full AI access
            </p>
          </div>
        </section>

        {/* ── Sample Report Preview ── */}
        <section className="py-12 sm:py-20 bg-muted/20 border-y border-border/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-3 mb-8 sm:mb-12">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Example Output</p>
              <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                What a CompanyIQ report looks like
              </h2>
            </div>

            {/* Report card */}
            <div className="max-w-2xl mx-auto rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 overflow-hidden shadow-2xl shadow-black/5">
              {/* Report header */}
              <div className="p-4 sm:p-8 border-b border-border/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 mb-1">{sampleReport.ticker}</p>
                    <h3 className="text-lg sm:text-xl font-black text-foreground">{sampleReport.company}</h3>
                  </div>
                  <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm ${
                    sampleReport.recommendation === "INVEST"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}>
                    {sampleReport.recommendation}
                  </div>
                </div>

                {/* Score metrics */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
                  {[
                    { label: "Score", value: `${sampleReport.score}/100` },
                    { label: "Confidence", value: `${sampleReport.confidence}%` },
                    { label: "Coverage", value: `${sampleReport.coverage}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-background/60 border border-border/20">
                      <p className="text-sm sm:text-lg font-black text-foreground">{value}</p>
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasons */}
              <div className="p-4 sm:p-8 space-y-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Core Investment Thesis</p>
                <div className="space-y-2.5 sm:space-y-3">
                  {sampleReport.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">{reason}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                  <p className="text-[10px] text-muted-foreground/40 font-medium text-center sm:text-left">
                    Powered by Yahoo Finance · Tavily · Gemini
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    Run live research
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section id="how-it-works" className="py-12 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-3 mb-10 sm:mb-14">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">AI Pipeline</p>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                How CompanyIQ thinks
              </h2>
              <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto">
                A structured, auditable workflow — not a single prompt. Every step is logged, timed, and inspectable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pipelineSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative flex items-start gap-3 p-4 rounded-2xl border border-border/30 bg-card/30">
                    <div className={`h-8 w-8 rounded-xl ${step.bg} border border-border/20 flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${step.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">{step.desc}</p>
                    </div>
                    <span className="absolute top-3 right-3 text-[9px] font-black text-muted-foreground/25 font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-12 sm:py-24 bg-muted/10 border-y border-border/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-3 mb-10 sm:mb-14">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Platform Capabilities</p>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Built for serious research
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-5 rounded-2xl border border-border/30 bg-card/40 space-y-3 hover:border-primary/20 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Technology ── */}
        <section id="technology" className="py-12 sm:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-3 mb-10 sm:mb-14">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Engineering Stack</p>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Modern AI infrastructure
              </h2>
              <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                Built with production-grade tooling. Multi-provider LLM failover ensures availability even under quota limits.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {techStack.map(({ name, role }) => (
                <div key={name} className="p-4 rounded-2xl border border-border/30 bg-card/30 text-center space-y-1">
                  <Code2 className="h-4 w-4 text-primary/60 mx-auto" />
                  <p className="text-xs font-bold text-foreground">{name}</p>
                  <p className="text-[10px] text-muted-foreground/50 font-medium">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-12 sm:py-28 border-t border-border/10 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[300px] bg-primary/4 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-7">
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              Ready to start your<br />research?
            </h2>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
              Create your free account in 30 seconds. No credit card. Full access to the AI research platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
              <Link
                href="/signup"
                className="flex w-full sm:w-auto items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/10 py-8 bg-background/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/40 text-center">
            AI-powered investment research. Not financial advice. For informational purposes only.
          </p>
          <p className="text-[10px] text-muted-foreground/30 font-mono">v3.4-prod · LangGraph</p>
        </div>
      </footer>
    </div>
  );
}
