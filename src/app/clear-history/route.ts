import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await db.searchHistory.deleteMany();
  } catch (error) {
    console.error("Failed to clear search history via action:", error);
  }
  
  // Redirect back to requesting page or fallback to landing page
  const referer = req.headers.get("referer");
  return NextResponse.redirect(new URL(referer || "/", req.url));
}
