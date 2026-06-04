"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/format";

export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Delete this? It can't be undone.",
  small,
}: {
  action: () => void | Promise<void>;
  label?: string;
  confirmText?: string;
  small?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) {
          startTransition(() => {
            void action();
          });
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 font-semibold text-rose-300 transition-colors hover:border-rose-500/60 hover:bg-rose-500/20 disabled:opacity-50",
        small ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
      )}
    >
      <Trash2 className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {pending ? "Deleting…" : label}
    </button>
  );
}
