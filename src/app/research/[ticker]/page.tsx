import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { ResearchClient } from "./ResearchClient";

interface PageProps {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ refresh?: string }>;
}

export const revalidate = 0;

export default async function ResearchPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const ticker = resolvedParams.ticker.toUpperCase();
  const refresh = resolvedSearchParams.refresh === "true";

  let cachedReport = null;

  if (!refresh) {
    try {
      const saved = await db.savedReport.findFirst({
        where: { ticker },
      });

      if (saved) {
        cachedReport = JSON.parse(saved.reportData);
        
        // Ensure watchlist state syncs with the cache
        cachedReport.isWatchlist = saved.isWatchlist;
        cachedReport.lastMonitored = saved.lastMonitored.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch (error) {
      console.error("Failed to read report cache from DB:", error);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Sidebar Navigation */}
      <AppHeader />

      {/* Main Research Client Wrapper */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col min-h-screen w-full max-w-full min-w-0">
        <ResearchClient 
          ticker={ticker} 
          initialReport={cachedReport} 
        />
      </main>
    </div>
  );
}
