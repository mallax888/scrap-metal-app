"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { signInWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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

  if (status === "sent") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-semibold text-stone-50">Check your email</h1>
        <p className="text-stone-400">
          We sent a sign-in link to <span className="font-medium text-stone-200">{email}</span>.
          Click it to continue.
        </p>
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
          That sign-in link didn&apos;t work: {callbackError}. Try sending a new one.
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
