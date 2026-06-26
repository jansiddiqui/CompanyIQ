import { cn } from "@/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer rounded-md bg-slate-800/40",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
