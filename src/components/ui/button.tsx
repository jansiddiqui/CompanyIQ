import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "glass" | "secondary" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97] active:translate-y-[0.5px] duration-150",
          {
            // Variants
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/20":
              variant === "default",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm":
              variant === "secondary",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md":
              variant === "accent",
            "border border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground":
              variant === "outline",
            "text-muted-foreground hover:bg-muted hover:text-foreground":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline bg-transparent":
              variant === "link",
            "glass text-foreground hover:bg-white/10 border border-white/10":
              variant === "glass",
            
            // Sizes
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
