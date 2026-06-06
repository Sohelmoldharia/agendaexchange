"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Layers,
  ScrollText,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/stocks", label: "Stocks", Icon: TrendingUp },
  { href: "/admin/categories", label: "Categories", Icon: Sparkles },
  { href: "/admin/series", label: "Series", Icon: Layers },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/orders", label: "Orders", Icon: ScrollText },
  { href: "/admin/market", label: "Market", Icon: Settings },
  { href: "/admin/audit", label: "Audit log", Icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (item: (typeof ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
      {ITEMS.map((item) => {
        const active = isActive(item);
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-amber-500/15 text-amber-200"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
