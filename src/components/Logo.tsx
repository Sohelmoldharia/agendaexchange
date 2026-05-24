import Link from "next/link";
import { cn } from "@/lib/format";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-base font-black text-white shadow-lg shadow-violet-500/40">
        ƒ
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-white">
        FAND<span className="gradient-text">X</span>
      </span>
    </Link>
  );
}
