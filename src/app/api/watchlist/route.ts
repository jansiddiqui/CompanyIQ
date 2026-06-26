import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/utils/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const watchlistOnly = searchParams.get("watchlistOnly") === "true";

    const reports = await db.savedReport.findMany({
      where: watchlistOnly
        ? { isWatchlist: true, userId: user.id }
        : { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ticker, name, score, recommendation, reportData, action } = body;

    if (!ticker) {
      return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
    }

    const symbol = ticker.trim().toUpperCase();

    // Scope all DB lookups to this user
    const existing = await db.savedReport.findFirst({
      where: { ticker: symbol, userId: user.id },
    });

    if (action === "toggle") {
      if (existing) {
        const updated = await db.savedReport.update({
          where: { id: existing.id },
          data: { isWatchlist: !existing.isWatchlist },
        });
        return NextResponse.json(updated);
      } else {
        const created = await db.savedReport.create({
          data: {
            ticker: symbol,
            name: name || `${symbol} Corp`,
            score: score || 50,
            recommendation: recommendation || "WATCHLIST",
            reportData: JSON.stringify(reportData || {}),
            isWatchlist: true,
            lastMonitored: new Date(),
            userId: user.id,
          },
        });
        return NextResponse.json(created);
      }
    }

    if (action === "delete") {
      if (existing) {
        await db.savedReport.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, message: "Report deleted" });
      }
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Default action: Save or Update report payload
    if (existing) {
      const updated = await db.savedReport.update({
        where: { id: existing.id },
        data: {
          score: score ?? existing.score,
          recommendation: recommendation ?? existing.recommendation,
          reportData: reportData ? JSON.stringify(reportData) : existing.reportData,
          lastMonitored: new Date(),
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await db.savedReport.create({
        data: {
          ticker: symbol,
          name: name || `${symbol} Corp`,
          score: score || 50,
          recommendation: recommendation || "WATCHLIST",
          reportData: JSON.stringify(reportData || {}),
          isWatchlist: false,
          lastMonitored: new Date(),
          userId: user.id,
        },
      });
      return NextResponse.json(created);
    }

  } catch (error: any) {
    console.error("Failed to manage report:", error);
    return NextResponse.json({ error: "Failed to manage report" }, { status: 500 });
  }
}
