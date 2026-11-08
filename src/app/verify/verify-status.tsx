"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VerifyStatus() {
  const [message, setMessage] = useState("Checking your email confirmation…");
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error) setMessage("We could not confirm this session. Please use the latest verification link from your email.");
        else if (data.user) setMessage("Your email is confirmed. You can now continue to the community. Your membership may still require administrator approval before uploading.");
        else setMessage("If you arrived from your verification email, the link may have expired or already been used. Try signing in, or request a new registration link.");
      } catch {
        if (active) setMessage("Email confirmation is not available in this deployment yet.");
      }
    })();
    return () => { active = false; };
  }, []);
  return <p role="status" aria-live="polite">{message}</p>;
}
