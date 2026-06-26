import { AppHeader } from "@/components/AppHeader";
import { Settings, ShieldCheck } from "lucide-react";

export const revalidate = 0; // Disable caching

export default function SettingsPage() {
  // Check process env variables on server side
  const hasTavily = !!process.env.TAVILY_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasNews = !!process.env.NEWS_API_KEY;
  
  const dbUrl = process.env.DATABASE_URL || "";
  const isSqlite = dbUrl.startsWith("file:") || dbUrl.includes("dev.db");

  const services = [
    {
      name: "Yahoo Finance Market Feed",
      desc: "Fetches corporate pricing, balance sheets, and cash flow sheets.",
      status: "Operational",
      badgeType: "success"
    },
    {
      name: "Tavily Search Agent API",
      desc: "Gathers business product portfolios, acquisitions, and competitive moats.",
      status: hasTavily ? "Operational (Production Key)" : "Fallback (Cached Mock Data)",
      badgeType: hasTavily ? "success" : "warning"
    },
    {
      name: "News Media Crawler API",
      desc: "Calibrates news sentiment scores over the last 30 days.",
      status: hasNews ? "Operational (Production Key)" : "Fallback (Tavily news streams)",
      badgeType: hasNews ? "success" : "warning"
    },
    {
      name: "Google Gemini Generative AI",
      desc: "Generates the explainability report, thesis catalysts, and suggested questions.",
      status: hasGemini ? "Operational (Gemini-2.5-Flash)" : "Fallback (Structured Mock Compiler)",
      badgeType: hasGemini ? "success" : "warning"
    },
    {
      name: "Relational Database Storage",
      desc: "Caches research queries, watchlists, and analyst summaries.",
      status: isSqlite ? "SQLite (Local dev.db)" : "PostgreSQL Database Engine",
      badgeType: "neutral"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Platform Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Review current system environment state and API configurations.
            </p>
          </div>

          {/* Security Banner */}
          <div className="flex gap-3 text-xs leading-relaxed text-foreground/80 border-l-2 border-primary pl-4 py-1">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-foreground block">Server-Side Authentication only</span>
              <p className="text-muted-foreground font-medium text-[11px] leading-normal">
                In compliance with production security standards for altuni/interview projects, client-facing forms for API key input have been removed. All keys are loaded securely from your server environment file (`.env.local`).
              </p>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Environment Integration Status</span>
            
            <div className="divide-y divide-border/10">
              {services.map((svc, i) => (
                <div key={i} className="py-4 flex flex-col gap-2 sm:flex-row sm:items-start justify-between sm:gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-xs text-foreground">{svc.name}</span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold shrink-0 self-start sm:self-auto ${
                        svc.badgeType === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                        svc.badgeType === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-muted text-muted-foreground border border-border/20'
                      }`}>
                        {svc.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/85 font-medium leading-relaxed max-w-sm">{svc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
