import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Contestant identity colors — distinct in both themes (match c1–c4 tokens).
export const CONTESTANT = ["#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

export const SORTS = [
  { key: "quality", label: "Quality" },
  { key: "affordability", label: "Most Affordable" },
  { key: "ease", label: "Ease of Use" },
  { key: "speed", label: "Speed" },
] as const;

export type SortKey = (typeof SORTS)[number]["key"];

export const SEGMENTS = [
  { key: "all", label: "All" },
  { key: "smb", label: "SMB" },
  { key: "mid", label: "Mid-Market" },
  { key: "ent", label: "Enterprise" },
  { key: "us", label: "US" },
  { key: "eu", label: "EU" },
  { key: "global", label: "Global" },
];

// Category nav metadata (lucide icon names resolved in client components).
export const CATEGORY_META = [
  { key: "cold-email", name: "Cold Email", icon: "Mail" },
  { key: "enrichment", name: "Enrichment", icon: "Sparkles" },
  { key: "email-context", name: "Email Context", icon: "Search" },
  { key: "parallel-dialer", name: "Parallel Dialer", icon: "Phone" },
  { key: "scraping", name: "Scraping", icon: "Globe" },
];

export const fmtSpeed = (ms?: number | null) =>
  ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`;
export const fmtPct = (x?: number | null) =>
  x == null ? "—" : `${Math.round(x * 100)}%`;
export const fmtCost = (n?: number | null, unit?: string) =>
  n == null ? "—" : `$${n}${unit ?? ""}`;
