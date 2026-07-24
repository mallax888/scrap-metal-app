"use client";

import type { AuthError, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "./supabase/client";

// AuthError.message is sometimes empty (e.g. upstream SMTP failures can come
// back with a bare {} body) — fall back to status/code, and always log the
// full error so it's inspectable even when the UI can't show much.
function describeAuthError(error: AuthError): string {
  console.error("Supabase auth error", error);
  if (error.message) return error.message;
  if (error.status) return `Request failed (status ${error.status}). Check Supabase Auth logs.`;
  return "Something went wrong. Check Supabase Auth logs for details.";
}

interface AuthState {
  user: User | null;
  loading: boolean;
  // Returns needsEmailConfirmation: true when the project requires confirming
  // the email before a session is issued (no error, but not signed in yet).
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: describeAuthError(error), needsEmailConfirmation: false };
        return { error: null, needsEmailConfirmation: !data.session };
      },
      signInWithPassword: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? describeAuthError(error) : null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [supabase, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
