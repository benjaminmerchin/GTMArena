import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Contestant identity colors — magenta, chartreuse, terracotta, mustard.
// Brightened for legibility on the dark theme; used ONLY as identity + chart
// marks (per the kernel), never as decoration.
export const CONTESTANT = ["#F2589B", "#DCE34F", "#E2895F", "#FACF39"];

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

export const fmtSpeed = (ms?: number | null) =>
  ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`;
export const fmtPct = (x?: number | null) =>
  x == null ? "—" : `${Math.round(x * 100)}%`;
export const fmtCost = (n?: number | null, unit?: string) =>
  n == null ? "—" : `$${n}${unit ?? ""}`;
