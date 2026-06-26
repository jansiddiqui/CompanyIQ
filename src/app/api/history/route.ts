import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/utils/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const history = await db.searchHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Failed to fetch search history:", error);
    return NextResponse.json({ error: "Failed to fetch search history" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await db.searchHistory.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true, message: "Search history cleared" });
  } catch (error: any) {
    console.error("Failed to clear search history:", error);
    return NextResponse.json({ error: "Failed to clear search history" }, { status: 500 });
  }
}
