"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { signInWithEmail, verifyEmailCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const { error } = await signInWithEmail(email.trim());
    if (error) {
      setError(error);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    const { error } = await verifyEmailCode(email.trim(), code.trim());
    if (error) {
      setVerifyError(error);
      setVerifying(false);
      return;
    }
    router.push("/portfolio");
  }

  if (status === "sent") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 rounded-2xl border border-stone-800 bg-stone-900 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-semibold text-stone-50">Check your email</h1>
          <p className="text-stone-400">
            We sent a code and a link to{" "}
            <span className="font-medium text-stone-200">{email}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-800 pt-4">
          <p className="text-sm text-stone-300">
            The link can fail if you open it inside an app&apos;s built-in browser (e.g.
            tapping it in the Mail app) — typing the code from the email here always
            works instead:
          </p>
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the code from your email"
              className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-center text-lg tracking-widest text-stone-50"
            />
            {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glow-accent mx-auto flex max-w-md flex-col gap-6 rounded-2xl border border-stone-800 bg-stone-900 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-stone-950">
          <Mail className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold text-stone-50">Sign in</h1>
        <p className="text-stone-400">No password needed — we&apos;ll email you a link.</p>
      </div>

      {callbackError && (
        <p className="rounded-lg border border-red-900/60 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          That sign-in link didn&apos;t work: {callbackError}. Try again below — if the
          link fails again, use the code from the email instead.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-50"
        />
        {status === "error" && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send magic link"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
