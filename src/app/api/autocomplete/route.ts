import { NextRequest, NextResponse } from "next/server";
import YahooFinance from 'yahoo-finance2';

// Set up a custom user agent to avoid Yahoo Finance rate limit issues or 401/403 blocks
const yahooFinance = new YahooFinance();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const cleanQuery = query.trim();

    if (cleanQuery.length < 1) {
      return NextResponse.json({ results: [] });
    }

    // Try fetching from Yahoo Finance search API
    // We run it with a timeout using Promise.race to keep it fast
    const fetchPromise = yahooFinance.search(cleanQuery, {
      newsCount: 0,
    });
    
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 1500)
    );

    const searchRes = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (searchRes && searchRes.quotes) {
      const results = searchRes.quotes
        .filter((q: any) => q.isEquity || q.quoteType === "EQUITY" || q.quoteType === "ETF")
        .map((q: any) => ({
          ticker: q.symbol,
          name: q.shortname || q.longname || q.name || "",
          exchange: q.exchange || "NASDAQ",
        }))
        .slice(0, 5);

      return NextResponse.json({ results });
    }
    
    throw new Error("No quotes returned");
  } catch (error: any) {
    console.warn("Autocomplete API search failed, returning popular ticker matches:", error.message);
    
    // Hardcoded high-ROI popular tickers for fallbacks with listing exchange metadata
    const popular = [
      { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
      { ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
      { ticker: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
      { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
      { ticker: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
      { ticker: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
      { ticker: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ" },
      { ticker: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ" },
      { ticker: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ" },
      { ticker: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYSE" },
      { ticker: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE" },
      { ticker: "V", name: "Visa Inc.", exchange: "NYSE" },
      { ticker: "DIS", name: "The Walt Disney Company", exchange: "NYSE" },
    ];
    
    const queryLower = searchParamsToQueryLower(req.url);
    const filtered = popular.filter(
      (p) =>
        p.ticker.toLowerCase().includes(queryLower) ||
        p.name.toLowerCase().includes(queryLower)
    ).slice(0, 5);

    return NextResponse.json({ results: filtered });
  }
}

function searchParamsToQueryLower(urlStr: string): string {
  try {
    const { searchParams } = new URL(urlStr);
    return (searchParams.get("q") || "").trim().toLowerCase();
  } catch {
    return "";
  }
}
