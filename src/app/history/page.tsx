import { AppHeader } from "@/components/AppHeader";
import { db } from "@/lib/db";
import { History as HistoryIcon, ArrowUpRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 0; // Disable caching

export default async function HistoryPage() {
  let recentSearches: any[] = [];

  try {
    recentSearches = await db.searchHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database connection failed. Falling back to empty array:", error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-primary" /> Search History
              </h1>
              {recentSearches.length > 0 && (
                <form action="/clear-history" method="POST" className="shrink-0">
                  <Button type="submit" variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/5 font-semibold whitespace-nowrap">
                    <Trash2 className="h-3.5 w-3.5 mr-1 shrink-0" /> Clear All
                  </Button>
                </form>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Review your recent equities research enquiries.
            </p>
          </div>

          {/* History List or Empty State */}
          {recentSearches.length > 0 ? (
            <div className="divide-y divide-border/10">
              {recentSearches.map((search, index) => (
                <div 
                  key={`${search.id}-${index}`} 
                  className="flex items-center justify-between py-3.5 border-b border-border/5 last:border-b-0 group font-semibold text-xs text-foreground/80 gap-4"
                >
                  {/* Left Side: Icon + Ticker details + Timestamp */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-secondary/50 border border-border/20 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                      <HistoryIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-foreground font-bold group-hover:text-primary transition-colors truncate">{search.ticker}</span>
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px] sm:max-w-[280px]">{search.name}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-medium mt-0.5">
                        {new Date(search.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: View button */}
                  <Link href={`/research/${search.ticker}`} className="shrink-0">
                    <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-xl text-[10px] font-bold border-border bg-card/45 hover:bg-muted transition-colors flex items-center shadow-sm">
                      View <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4 flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center border border-border text-muted-foreground shadow-inner">
                <HistoryIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-foreground/80">No Search History</h3>
                <p className="text-[10px] text-muted-foreground max-w-xs leading-normal">
                  Equities will appear here once you run search enquiries from the dashboard.
                </p>
              </div>
              <Link href="/">
                <Button size="sm" className="font-bold text-xs mt-2 px-4 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 flex items-center">
                  Start Research
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
