"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { signUp, signInWithPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);

    if (mode === "register") {
      const { error, needsEmailConfirmation } = await signUp(email.trim(), password);
      if (error) {
        setError(error);
        setSubmitting(false);
        return;
      }
      if (needsEmailConfirmation) {
        setConfirmationSent(true);
        setSubmitting(false);
        return;
      }
      router.push("/portfolio");
      return;
    }

    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      setError(error);
      setSubmitting(false);
      return;
    }
    router.push("/portfolio");
  }

  if (confirmationSent) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h1 className="text-xl font-semibold text-stone-50">Confirm your email</h1>
        <p className="text-stone-400">
          We sent a confirmation link to{" "}
          <span className="font-medium text-stone-200">{email}</span>. Click it, then come
          back and sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="glow-accent mx-auto flex max-w-md flex-col gap-6 rounded-2xl border border-stone-800 bg-stone-900 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-stone-950">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold text-stone-50">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
      </div>

      <div className="flex w-fit gap-1 self-center rounded-full border border-stone-800 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className={
            mode === "signin"
              ? "rounded-full bg-amber-600 px-4 py-1.5 text-sm font-medium text-stone-950"
              : "rounded-full px-4 py-1.5 text-sm font-medium text-stone-400"
          }
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={
            mode === "register"
              ? "rounded-full bg-amber-600 px-4 py-1.5 text-sm font-medium text-stone-950"
              : "rounded-full px-4 py-1.5 text-sm font-medium text-stone-400"
          }
        >
          Register
        </button>
      </div>

      {callbackError && (
        <p className="rounded-lg border border-red-900/60 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {callbackError}
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
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-50"
        />
        {mode === "register" && (
          <p className="text-xs text-stone-500">At least 6 characters.</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-amber-600 px-5 py-2.5 font-medium text-stone-950 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
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
