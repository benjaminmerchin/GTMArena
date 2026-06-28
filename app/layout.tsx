import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GTM Arena — find the best tools for your GTM stack",
  description:
    "A crowdsourced leaderboard that benchmarks low-level GTM tools — ranked by the crowd and by LLMs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <header className="sticky top-0 z-20 border-b bg-bg/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
              <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-coral text-[13px] text-white">
                  ▲
                </span>
                GTM&nbsp;Arena
              </Link>
              <nav className="flex items-center gap-5 text-sm text-ink/60">
                <Link href="/" className="hover:text-ink">Hub</Link>
                <Link href="/race" className="hover:text-ink">Enrichment Race</Link>
                <a
                  href="https://github.com/benjaminmerchin/GTMArena"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-5 py-10 text-xs text-ink/40">
            GTM Arena · built on Convex for the AI Growth Hackathon · blind votes + LLM judges
          </footer>
        </Providers>
      </body>
    </html>
  );
}
