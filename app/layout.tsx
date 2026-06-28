import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GTM Arena — find the best tools for your GTM stack",
  description:
    "A crowdsourced leaderboard that benchmarks low-level GTM tools — ranked by the crowd and by LLMs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
              <Link
                href="/"
                className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight"
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-coral text-[12px] text-white shadow-glow">
                  ▲
                </span>
                GTM&nbsp;Arena
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <NavLink href="/">Hub</NavLink>
                <NavLink href="/race">Enrichment Race</NavLink>
                <a
                  href="https://github.com/benjaminmerchin/GTMArena"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-3 py-1.5 text-ink/50 transition hover:bg-white/5 hover:text-ink"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
          <footer className="mx-auto max-w-6xl px-5 py-12 text-xs text-ink/35">
            GTM Arena · built on Convex for the AI Growth Hackathon · blind votes + LLM judges
          </footer>
        </Providers>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-ink/55 transition hover:bg-white/5 hover:text-ink"
    >
      {children}
    </Link>
  );
}
