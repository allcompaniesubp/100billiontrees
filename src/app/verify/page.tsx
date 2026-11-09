import Link from "next/link";
import VerifyStatus from "./verify-status";

export default function Verify() {
  return <main className="auth-page">
    <Link href="/" className="auth-brand">← 200 Billion Trees</Link>
    <section className="auth-card">
      <div className="kicker">Email verification</div>
      <h1>Verify your email</h1>
      <p>Open the confirmation link sent to your registered email address. This page checks the Supabase session after the link is processed.</p>
      <VerifyStatus />
      <p><Link href="/community">Continue to community</Link></p>
      <p><Link href="/sign-in">Return to sign in</Link></p>
    </section>
  </main>;
}