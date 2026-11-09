"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import SocialSignIn from "@/app/auth/social-sign-in";

export default function SignInForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/community");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit}>
    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
    <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    {message && <p role="alert">{message}</p>}
    <SocialSignIn />
    <p><Link href="/forgot-password">Forgot password?</Link></p>
    <p>New here? <Link href="/register">Create an account</Link></p>
  </form>;
}
