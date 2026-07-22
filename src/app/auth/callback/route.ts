import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portfolio";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback: exchangeCodeForSession failed", error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const errorDescription = searchParams.get("error_description");
  console.error("Auth callback: no code param", { errorDescription, url: request.url });
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(errorDescription ?? "No sign-in code was returned.")}`
  );
}
