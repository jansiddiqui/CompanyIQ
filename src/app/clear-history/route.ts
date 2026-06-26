import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/utils/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.searchHistory.deleteMany({
      where: { userId: user.id },
    });
  } catch (error) {
    console.error("Failed to clear search history via action:", error);
  }
  
  // Redirect back to requesting page or fallback to landing page
  const referer = req.headers.get("referer");
  return NextResponse.redirect(new URL(referer || "/", req.url));
}
