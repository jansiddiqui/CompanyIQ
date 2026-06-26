import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/utils/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      // Delete session from database
      await db.session.deleteMany({ where: { token } }).catch(() => {});
    }

    const response = NextResponse.json({ success: true });

    // Clear the cookie
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[signout] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
