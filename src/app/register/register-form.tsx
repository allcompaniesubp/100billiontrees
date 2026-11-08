"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });
      if (error) throw error;
      if (data.session) {
        router.push("/community");
        router.refresh();
      } else {
        setMessage("Registration received. Check your email and confirm your address before signing in. Your member profile will be created automatically.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit}>
    <label>Full name<input name="name" autoComplete="name" required maxLength={100} /></label>
    <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
    <button type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
    {message && <p role="status" aria-live="polite">{message}</p>}
    <p>Already registered? <Link href="/sign-in">Sign in</Link></p>
    <small>Confirm your email to activate your account. New members begin with pending approval; uploads require approval.</small>
  </form>;
}
