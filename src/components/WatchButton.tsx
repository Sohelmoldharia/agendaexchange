"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/format";

export function WatchButton({
  ticker,
  initialWatching,
  isAuthed,
  className,
}: {
  ticker: string;
  initialWatching: boolean;
  isAuthed: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [watching, setWatching] = useState(initialWatching);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      const data = await res.json();
      if (res.ok) {
        setWatching(data.watching);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "btn-ghost",
        watching && "border-amber-400/40 text-amber-300",
        className,
      )}
    >
      <Star className={cn("h-4 w-4", watching && "fill-amber-300")} />
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
