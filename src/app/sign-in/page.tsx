import Link from "next/link";
import SignInForm from "./sign-in-form";

export default function SignIn() {
  return <main className="auth-page">
    <Link href="/" className="auth-brand"><img src="/entire-space-absolute-foundation.svg" alt="Entire Space Absolute Foundation" width="300" /></Link>
    <section className="auth-card">
      <div className="kicker">Member access</div>
      <h1>Welcome back</h1>
      <p>Sign in to manage planting records, projects and community activity.</p>
      <SignInForm />
    </section>
  </main>;
}