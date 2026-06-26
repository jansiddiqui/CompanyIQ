"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Trash2, 
  ArrowRight, 
  Star,
  RefreshCw,
  BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportItem {
  id: string;
  ticker: string;
  name: string;
  score: number;
  recommendation: string;
  isWatchlist: boolean;
  lastMonitored: string;
  reportData: any;
}

interface WatchlistListProps {
  initialReports: ReportItem[];
}

export function WatchlistList({ initialReports }: WatchlistListProps) {
  const [reports, setReports] = React.useState<ReportItem[]>(initialReports);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (ticker: string) => {
    if (!confirm(`Are you sure you want to remove ${ticker} from your watchlist?`)) return;
    
    setDeletingId(ticker);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, action: "delete" }),
      });

      if (res.ok) {
        setReports(reports.filter((rep) => rep.ticker !== ticker));
      } else {
        alert("Failed to delete the report");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting report");
    } finally {
      setDeletingId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 space-y-4 flex flex-col items-center justify-center">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center border border-border text-muted-foreground shadow-inner">
          <Star className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-xs text-foreground/80">Your Watchlist is Empty</h3>
          <p className="text-[10px] text-muted-foreground max-w-xs leading-normal">
            Equities will appear here once you watchlist them during research analysis.
          </p>
        </div>
        <Link href="/">
          <Button size="sm" className="font-bold text-xs mt-2 px-4 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 flex items-center">
            Start Research
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Responsive Card Grid (Investment Workspace) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            className="p-6 bg-card border border-border rounded-3xl hover:border-primary/30 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between space-y-6 group shadow-sm hover:shadow-primary/5 relative overflow-hidden"
          >
            {/* Recommendation Color Bar Indicator */}
            <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${
              report.recommendation === 'INVEST' ? 'bg-green-500/80' : 
              report.recommendation === 'WATCHLIST' ? 'bg-amber-500/80' : 
              'bg-red-500/80'
            }`} />

            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 block">Asset Code</span>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 min-w-0">
                  <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors shrink-0">{report.ticker}</h3>
                  <span className="text-xs font-semibold text-muted-foreground truncate max-w-[220px] sm:max-w-[130px] md:max-w-[150px] inline-block">{report.name}</span>
                </div>
              </div>

              {/* Recommendation Badge */}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black select-none shrink-0 ${
                report.recommendation === 'INVEST' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                report.recommendation === 'WATCHLIST' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {report.recommendation}
              </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/10">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/50 block">Score</span>
                <span className="text-base font-black text-foreground">{report.score}/100</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/50 block">Sync status</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-foreground/80">Active Scan</span>
                </div>
              </div>
            </div>

            {/* Monitoring meta and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pt-1">
              <span className="text-[9px] text-muted-foreground/50 font-semibold shrink-0">
                Synced: {report.lastMonitored}
              </span>
              
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Link href={`/research/${report.ticker}`} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto px-3 text-[10px] font-bold border-border bg-card hover:bg-muted rounded-xl flex items-center justify-center gap-1">
                    View Report <ArrowRight className="h-3 w-3 shrink-0" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(report.ticker)}
                  disabled={deletingId === report.ticker}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
