import Link from "next/link";
import { Github } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-white/85 px-6 backdrop-blur lg:px-10">
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-navy text-[11px] text-white">
            ▲
          </span>
          <span className="font-display text-lg text-ink">GTM Arena</span>
        </Link>
        <span className="hidden items-center gap-2 text-sm text-ink/50 lg:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-c1 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-c1" />
          </span>
          Live · ranked by humans + LLMs
        </span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/benjaminmerchin/GTMArena"
          target="_blank"
          rel="noreferrer"
          className="btn-soft"
        >
          <Github size={15} /> GitHub
        </a>
      </div>
    </header>
  );
}
