"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VerifyStatus() {
  const [message, setMessage] = useState("Completing your email confirmation…");

  useEffect(() => {
    let active = true;

    async function completeVerification() {
      try {
        const supabase = getSupabaseBrowserClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription = url.searchParams.get("error_description");

        if (errorDescription) {
          throw new Error(errorDescription.replace(/\+/g, " "));
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          url.search = "";
          window.history.replaceState({}, document.title, url.pathname);
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!active) return;
        if (data.user) {
          setMessage("Your email is confirmed successfully. You can now sign in. Your membership may still require administrator approval before uploading.");
        } else {
          setMessage("We could not find a confirmed session. If you already clicked the email link, try signing in. Otherwise request a fresh confirmation email.");
        }
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error
          ? `Email confirmation could not be completed: ${error.message}`
          : "Email confirmation could not be completed. Please request a fresh confirmation email.");
      }
    }

    void completeVerification();
    return () => { active = false; };
  }, []);

  return <p role="status" aria-live="polite">{message}</p>;
}
