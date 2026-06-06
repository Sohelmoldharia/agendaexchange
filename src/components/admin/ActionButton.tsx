"use client";

import { useTransition } from "react";
import { cn } from "@/lib/format";

export function ActionButton({
  action,
  confirm,
  className,
  children,
  disabled,
  pendingLabel,
}: {
  action: () => void | Promise<void>;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  pendingLabel?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || disabled}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(() => {
          void action();
        });
      }}
      className={cn(className, "disabled:cursor-not-allowed disabled:opacity-50")}
    >
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
