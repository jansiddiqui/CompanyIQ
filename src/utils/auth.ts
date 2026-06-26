import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "ciq_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * Resolves the current authenticated user from the session cookie.
 * Returns null if the session is missing, invalid, or expired.
 * This must only be called in Server Components or API Routes.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!session) return null;
    if (session.expiresAt < new Date()) {
      // Session expired — clean up silently
      await db.session.delete({ where: { token } }).catch(() => {});
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch {
    return null;
  }
}
