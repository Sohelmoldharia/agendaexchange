import { cn } from "@/lib/format";
import { BLOCKED_META, STATUS_META } from "@/lib/anime/meta";
import type { AnimeSite } from "@/lib/anime/sites";

export function StatusBadge({
  status,
  className,
}: {
  status: AnimeSite["status"];
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        meta.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function BlockedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        BLOCKED_META.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", BLOCKED_META.dot)} />
      Blocked
    </span>
  );
}
