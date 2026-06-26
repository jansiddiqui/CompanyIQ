import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
        {
          "border-transparent bg-blue-500/10 text-blue-400": variant === "default",
          "border-transparent bg-slate-800 text-slate-300": variant === "secondary",
          "border-transparent bg-red-500/10 text-red-400": variant === "destructive",
          "border-slate-800 bg-transparent text-slate-400": variant === "outline",
          "border-transparent bg-emerald-500/10 text-emerald-400": variant === "success",
          "border-transparent bg-amber-500/10 text-amber-400": variant === "warning",
          "border-transparent bg-indigo-500/10 text-indigo-400": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps as UI_BadgeProps };
