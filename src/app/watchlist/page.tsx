import { AppHeader } from "@/components/AppHeader";
import { db } from "@/lib/db";
import { Star } from "lucide-react";
import { WatchlistList } from "./WatchlistList";

export const revalidate = 0; // Disable server-side caching to always reflect modifications

export default async function WatchlistPage() {
  let reports: any[] = [];

  try {
    reports = await db.savedReport.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to load saved reports from database:", error);
  }

  // Parse reportData from JSON strings
  const parsedReports = reports.map((rep) => {
    let parsedData = {};
    try {
      parsedData = JSON.parse(rep.reportData);
    } catch (e) {
      console.error(`Failed to parse reportData for ticker ${rep.ticker}`);
    }
    return {
      id: rep.id,
      ticker: rep.ticker,
      name: rep.name,
      score: rep.score,
      recommendation: rep.recommendation,
      isWatchlist: rep.isWatchlist,
      lastMonitored: rep.lastMonitored.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      reportData: parsedData,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Navigation */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Saved Watchlist
            </h1>
            <p className="text-xs text-muted-foreground">
              Monitor saved equities and review cached analyses.
            </p>
          </div>

          {/* Interactive Client Component for Lists and Deletions */}
          <WatchlistList initialReports={parsedReports} />
        </div>
      </main>
    </div>
  );
}
