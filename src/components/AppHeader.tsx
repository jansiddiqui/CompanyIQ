/**
 * AppHeader is a thin server component wrapper around Sidebar.
 * It resolves the current session user server-side and injects it
 * into the client Sidebar component — so individual pages don't
 * each need to fetch the user themselves.
 */
import { getCurrentUser } from "@/utils/auth";
import { Sidebar } from "./Sidebar";

export async function AppHeader() {
  const user = await getCurrentUser();
  return <Sidebar user={user} />;
}
