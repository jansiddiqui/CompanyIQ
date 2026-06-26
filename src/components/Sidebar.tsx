"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Moon, 
  Sun, 
  Menu, 
  X,
  LayoutDashboard,
  Star,
  History,
  Cpu,
  Settings,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./ui/button";

type Props = {
  user?: { name: string; email: string } | null;
};

export function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = React.useState<"dark" | "light">("light");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains("light") ? "light" : "dark";
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("light");
      setTheme("light");
    } else {
      root.classList.remove("light");
      setTheme("dark");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      // Ignore
    } finally {
      setSigningOut(false);
    }
  };

  const authNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Watchlist", href: "/watchlist", icon: Star },
    { name: "History", href: "/history", icon: History },
    { name: "Architecture", href: "/architecture", icon: Cpu },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const publicNavItems = [
    { name: "How it Works", href: "/#how-it-works", icon: Cpu },
    { name: "Features", href: "/#features", icon: Star },
  ];

  const navItems = user ? authNavItems : publicNavItems;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center h-11" aria-label="CompanyIQ Home">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 hover:bg-primary/20 transition-all duration-300 shadow-sm shadow-primary/5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/#how-it-works" && item.href !== "/#features" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-xs font-semibold transition-all duration-200 relative py-2.5 hover:text-foreground",
                    isActive ? "text-foreground" : "text-muted-foreground/80"
                  )}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full animate-in fade-in zoom-in duration-200" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Options */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Auth actions — desktop */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="hidden md:flex h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground items-center gap-1.5 rounded-xl"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 rounded-xl"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary md:hidden rounded-xl"
              aria-label="Open Navigation Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none invisible"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Navigation Drawer Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-[280px] bg-background border-l border-border p-6 flex flex-col transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none invisible"
        )}
      >
        {/* Drawer Close Button & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">Navigation</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            aria-label="Close Navigation Menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Drawer Links */}
        <nav className="flex flex-col space-y-2 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/#how-it-works" && item.href !== "/#features" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-sm font-semibold transition-all duration-200 h-11 flex items-center px-4 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  isActive 
                    ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5" 
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 mr-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="pt-6 border-t border-border/10 mt-auto space-y-3">
          {user ? (
            <>
              <div className="px-2 space-y-0.5">
                <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground/50 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="w-full h-11 flex items-center gap-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
              >
                <LogOut className="h-4 w-4 text-muted-foreground/60" />
                Sign out
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full h-11 flex items-center gap-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all"
              >
                <LogIn className="h-4 w-4 text-muted-foreground/60" />
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Create account
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-muted-foreground/40">Theme</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 bg-background border border-border/10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg shadow-sm"
              aria-label="Toggle Theme in Drawer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="text-center text-[9px] text-muted-foreground/40 pt-1 font-mono">
            CompanyIQ Engine v3.4-prod
          </div>
        </div>
      </div>
    </>
  );
}
