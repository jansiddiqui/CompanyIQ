import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, generateToken } from "@/utils/hash";
import { SESSION_COOKIE } from "@/utils/auth";
import { z } from "zod";

const SigninSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

const SESSION_DURATION_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SigninSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Intentionally vague to prevent email enumeration
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = generateToken();
    const durationDays = rememberMe ? 30 : SESSION_DURATION_DAYS;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await db.session.create({
      data: { token, userId: user.id, expiresAt },
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[signin] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
