"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="surface w-full max-w-sm p-8 text-center">{children}</div>
    </div>
  );
}

function Verify() {
  const token = useSearchParams().get("token");
  const verify = useMutation(api.users.verifyMagicLink);
  const ran = useRef(false);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setStatus("error");
      setMsg("This link is missing its token.");
      return;
    }
    verify({ token })
      .then((u: any) => {
        localStorage.setItem("gtm_uid", u._id);
        setStatus("ok");
        setTimeout(() => window.location.replace("/"), 700);
      })
      .catch((e: any) => {
        setStatus("error");
        setMsg(e?.message ?? "Could not verify this link.");
      });
  }, [token, verify]);

  if (status === "loading")
    return (
      <Shell>
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
        <p className="mt-4 text-sm text-ink/55">Signing you in…</p>
      </Shell>
    );

  if (status === "ok")
    return (
      <Shell>
        <div className="text-2xl">✓</div>
        <p className="mt-3 font-display text-lg font-semibold text-ink">You're in</p>
        <p className="mt-1 text-sm text-ink/55">Taking you to GTM Arena…</p>
      </Shell>
    );

  return (
    <Shell>
      <p className="font-display text-lg font-semibold text-ink">Sign-in failed</p>
      <p className="mt-1 text-sm text-ink/55">{msg}</p>
      <Link href="/" className="btn-soft mt-5 inline-flex">
        Back to GTM Arena
      </Link>
    </Shell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Shell>Verifying…</Shell>}>
      <Verify />
    </Suspense>
  );
}
