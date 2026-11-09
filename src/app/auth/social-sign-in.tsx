"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SocialSignIn() {
  const router = useRouter();
  const [busy, setBusy] = useState<"google" | "github" | null>(null);
  const [message, setMessage] = useState("");

  async function start(provider: "google" | "github") {
    setBusy(provider);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/verify?flow=oauth`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Social sign-in could not be started.");
      setBusy(null);
    }
  }

  return <section aria-label="Continue with a social account" className="social-auth">
    <p>Or continue with</p>
    <div className="social-auth-actions">
      <button type="button" onClick={() => void start("google")} disabled={busy !== null}>
        {busy === "google" ? "Connecting…" : "Continue with Google"}
      </button>
      <button type="button" onClick={() => void start("github")} disabled={busy !== null}>
        {busy === "github" ? "Connecting…" : "Continue with GitHub"}
      </button>
    </div>
    {message && <p role="alert">{message}</p>}
  </section>;
}
