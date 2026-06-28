"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Zap, Trophy, Mail, Sparkles, Search, Phone, Globe, Landmark } from "lucide-react";
import { cn, CATEGORY_META } from "@/lib/ui";

const ICONS: Record<string, any> = { Mail, Sparkles, Search, Phone, Globe };

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-[#080C16] px-3 py-5 lg:flex">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        <Landmark className="h-6 w-6 text-white" />
        <span className="font-display text-xl leading-none text-white">GTM Arena</span>
      </Link>

      <nav className="space-y-1">
        <Link href="/" className={cn("sidebar-link", path === "/" && "sidebar-link-active")}>
          <Plus size={16} /> New battle
        </Link>
        <Link
          href="/race"
          className={cn("sidebar-link", path === "/race" && "sidebar-link-active")}
        >
          <Zap size={16} /> Enrichment Race
        </Link>
        <Link
          href="/c/cold-email"
          className={cn("sidebar-link", path.startsWith("/c/") && "sidebar-link-active")}
        >
          <Trophy size={16} /> Leaderboards
        </Link>
      </nav>

      <div className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink/35">
        Categories
      </div>
      <nav className="space-y-1">
        {CATEGORY_META.map((c) => {
          const Icon = ICONS[c.icon] ?? Sparkles;
          const active = path === `/c/${c.key}`;
          return (
            <Link
              key={c.key}
              href={`/c/${c.key}`}
              className={cn("sidebar-link", active && "sidebar-link-active")}
            >
              <Icon size={16} /> {c.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <button className="btn-navy w-full">Sign in</button>
        <div className="px-2 text-[11px] leading-relaxed text-ink/35">
          Built on Convex · AI Growth Hackathon
        </div>
      </div>
    </aside>
  );
}
