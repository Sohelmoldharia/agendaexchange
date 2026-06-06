"use client";

import { cn } from "@/lib/format";

export function ConfirmSubmit({
  children,
  confirm,
  className,
}: {
  children: React.ReactNode;
  confirm?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(className)}
    >
      {children}
    </button>
  );
}
