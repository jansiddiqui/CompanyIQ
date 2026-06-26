import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/utils/auth";
import { AppHeader } from "@/components/AppHeader";
import { SearchForm } from "@/components/SearchForm";
import { TrendingUp, Clock, Star, ArrowUpRight, Zap, BarChart3, ShieldCheck } from "lucide-react";

export const revalidate = 0;

const suggestedCompanies = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "EV / Automotive" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce / Cloud" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
];

const quickActions = [
  { icon: Zap, label: "Research a company", href: "/dashboard", description: "Run the full AI pipeline" },
  { icon: Star, label: "My Watchlist", href: "/watchlist", description: "Monitor saved equities" },
  { icon: Clock, label: "History", href: "/history", description: "View past research sessions" },
  { icon: BarChart3, label: "Architecture", href: "/architecture", description: "See how the AI engine works" },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Load user's recent research history
  let recentHistory: { id: string; ticker: string; name: string; createdAt: Date }[] = [];
  let watchlistItems: { id: string; ticker: string; name: string; score: number; recommendation: string }[] = [];

  try {
    [recentHistory, watchlistItems] = await Promise.all([
      db.searchHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.savedReport.findMany({
        where: { userId: user.id, isWatchlist: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, ticker: true, name: true, score: true, recommendation: true },
      }),
    ]);
  } catch {
    // Fallback to empty — DB errors shouldn't break dashboard
  }

  const firstName = user.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Welcome Header */}
        <div className="space-y-2">
          <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/50">{greeting}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            {firstName}
            <span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-muted-foreground/70 font-medium">
            Your AI investment research workspace is ready.
          </p>
        </div>

        {/* Search — central action */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">New Research</p>
          <div className="max-w-xl">
            <SearchForm />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(({ icon: Icon, label, href, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl border border-border/40 bg-card/40 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200"
              >
                <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {/* Recent Research */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Recent Research</p>
              {recentHistory.length > 0 && (
                <Link href="/history" className="text-[10px] text-primary font-semibold hover:underline">
                  View all
                </Link>
              )}
            </div>

            {recentHistory.length === 0 ? (
              <div className="rounded-2xl border border-border/30 bg-card/20 p-6 text-center space-y-2">
                <TrendingUp className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground/50 font-medium">No research yet</p>
                <p className="text-[11px] text-muted-foreground/40">Search for a company above to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20 border border-border/30 rounded-2xl overflow-hidden bg-card/20">
                {recentHistory.map((item) => (
                  <Link
                    key={item.id}
                    href={`/research/${item.ticker}`}
                    className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/30 transition-all group min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors shrink-0">{item.ticker}</span>
                        <span className="text-[10px] text-muted-foreground/60 font-medium truncate max-w-[120px] sm:max-w-[100px] md:max-w-[160px] lg:max-w-[240px] inline-block">{item.name}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Watchlist</p>
              {watchlistItems.length > 0 && (
                <Link href="/watchlist" className="text-[10px] text-primary font-semibold hover:underline">
                  View all
                </Link>
              )}
            </div>

            {watchlistItems.length === 0 ? (
              <div className="rounded-2xl border border-border/30 bg-card/20 p-6 text-center space-y-2">
                <Star className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground/50 font-medium">No watchlist items</p>
                <p className="text-[11px] text-muted-foreground/40">Save companies from any research report</p>
              </div>
            ) : (
              <div className="space-y-2">
                {watchlistItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/research/${item.ticker}`}
                    className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-border/30 bg-card/20 hover:border-primary/30 hover:bg-primary/3 transition-all group min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <Star className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="min-w-0 flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors shrink-0">{item.ticker}</span>
                        <span className="text-[10px] text-muted-foreground/60 font-medium truncate max-w-[80px] sm:max-w-[150px] inline-block">{item.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.recommendation === "INVEST"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : item.recommendation === "WATCHLIST"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {item.recommendation}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono">{item.score}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suggested Companies */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Suggested Companies</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {suggestedCompanies.map(({ ticker, name, sector }) => (
              <Link
                key={ticker}
                href={`/research/${ticker}`}
                className="group flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-border/30 bg-card/20 hover:border-primary/30 hover:bg-primary/3 transition-all min-w-0"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{ticker}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5 truncate block">{sector}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/20 bg-card/10">
          <ShieldCheck className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
            Your research history and watchlists are private to your account. CompanyIQ uses live AI models (Gemini, OpenRouter, Groq) and financial APIs. Each research session consumes real compute resources.
          </p>
        </div>
      </main>
    </div>
  );
}
