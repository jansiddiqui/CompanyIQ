import * as React from "react";
import Link from "next/link";
import { TrendingUp, BarChart3, BookOpen, Star, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Sign In — CompanyIQ",
  description: "Sign in to your CompanyIQ AI investment research workspace.",
};

const benefits = [
  { icon: BarChart3, text: "AI Investment Committee reports" },
  { icon: BookOpen, text: "Persistent research history" },
  { icon: Star, text: "Personal watchlist" },
  { icon: ShieldCheck, text: "Secure compute resource allocation" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary/8 via-background to-background border-r border-border/10 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/3 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center" aria-label="CompanyIQ Home">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all duration-300 shadow-sm shadow-primary/5">
            <TrendingUp className="h-5.5 w-5.5 text-primary" />
          </div>
        </Link>

        {/* Middle content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl xl:text-3xl font-black text-foreground leading-tight">
              Your AI Investment<br />Research Workspace
            </h2>
            <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
              CompanyIQ runs live AI models and financial data APIs on your behalf. Authentication protects compute resources and keeps your research private.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50">Your account includes</p>
            <div className="space-y-2.5">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-foreground/80">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-muted-foreground/40 font-mono">
          CompanyIQ Engine v3.4-prod · Multi-Agent LangGraph
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden w-full max-w-sm mb-8">
          <Link href="/" className="flex items-center" aria-label="CompanyIQ Home">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all duration-300 shadow-sm shadow-primary/5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground/80">
              Welcome back to your research workspace.
            </p>
          </div>

          {/* LoginForm uses useSearchParams — must be in Suspense */}
          <React.Suspense
            fallback={
              <div className="h-64 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
