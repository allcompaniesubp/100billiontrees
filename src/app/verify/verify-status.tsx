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
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (errorDescription) {
          throw new Error(errorDescription.replace(/\+/g, " "));
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!active) return;

        if (data.user?.email_confirmed_at) {
          if (url.searchParams.get("flow") === "oauth") {
            setMessage("Sign-in successful. Opening the community…");
            window.history.replaceState({}, document.title, url.pathname);
            window.location.assign("/community");
            return;
          }
          setMessage("Your email is confirmed successfully. You can now sign in. Your membership may still require administrator approval before uploading.");
          window.history.replaceState({}, document.title, url.pathname);
        } else if (data.user) {
          setMessage("Your account was found, but email confirmation is not yet complete. Please open the latest confirmation email or request a new one.");
        } else {
          setMessage("No active session was found. If you have already confirmed your email, go to Sign in. Otherwise request a fresh confirmation email.");
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
