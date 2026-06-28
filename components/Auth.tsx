"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type User = { _id: string; name: string; email: string } | null;

type AuthCtx = {
  user: User;
  ready: boolean;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx>({ user: null, ready: false, signOut: () => {} });
const KEY = "gtm_uid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUserId(localStorage.getItem(KEY));
    setReady(true);
    // keep tabs in sync (the /auth/verify page sets this then redirects)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setUserId(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const user = (useQuery(api.users.get, userId ? { userId } : "skip") ?? null) as User;

  function signOut() {
    localStorage.removeItem(KEY);
    setUserId(null);
  }

  return <Ctx.Provider value={{ user, ready, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

// Sidebar control: signed-in chip (with sign-out) or a magic-link sign-in modal.
export function AuthButton() {
  const { user, signOut } = useAuth();
  const requestLink = useAction(api.users.requestMagicLink);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");

  function close() {
    setOpen(false);
    setSent(false);
    setEmail("");
    setDevUrl(null);
    setErr("");
  }

  async function submit() {
    if (!email.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const r: any = await requestLink({ email, origin: window.location.origin });
      setSent(true);
      if (r?.sent === false && r.url) setDevUrl(r.url);
    } catch (e: any) {
      setErr(e?.message ?? "Could not send link");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-ink/[0.03] px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-sm text-ink">{user.name}</span>
        </div>
        <button
          onClick={signOut}
          className="shrink-0 text-xs text-ink/45 transition hover:text-ink"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-navy w-full">
        Sign in
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div className="surface w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            {!sent ? (
              <>
                <h2 className="font-display text-xl font-semibold text-ink">
                  Sign in to GTM Arena
                </h2>
                <p className="mt-1 text-sm text-ink/50">
                  We'll email you a one-time magic link — no password.
                </p>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="you@company.com"
                  className="mt-5 w-full rounded-xl border border-line bg-ink/[0.03] px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent placeholder:text-ink/35"
                />
                {err && <p className="mt-2 text-xs text-rose-400">{err}</p>}
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={close} className="btn-soft">
                    Cancel
                  </button>
                  <button onClick={submit} disabled={busy} className="btn-navy">
                    {busy ? "Sending…" : "Send magic link"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold text-ink">Check your email</h2>
                <p className="mt-2 text-sm text-ink/55">
                  We sent a sign-in link to <b className="text-ink">{email}</b>. It expires in
                  15 minutes.
                </p>
                {devUrl && (
                  <p className="mt-3 rounded-lg border border-line bg-ink/[0.03] p-3 text-xs text-ink/55">
                    Email isn't configured —{" "}
                    <a href={devUrl} className="font-medium text-accent hover:underline">
                      use this link
                    </a>{" "}
                    to sign in for the demo.
                  </p>
                )}
                <div className="mt-5 flex justify-end">
                  <button onClick={close} className="btn-soft">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
