import { TrendingDown, TrendingUp } from "lucide-react";
import { cn, formatPercent } from "@/lib/format";

export function ChangeBadge({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-semibold",
        up ? "text-emerald-400" : "text-rose-400",
        size === "sm" ? "text-sm" : "text-base",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {formatPercent(value)}
    </span>
  );
}
