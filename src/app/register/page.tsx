import Link from "next/link";
import RegisterForm from "./register-form";

export default function Register() {
  return <main className="auth-page">
    <Link href="/" className="auth-brand"><img src="/entire-space-absolute-foundation.svg" alt="Entire Space Absolute Foundation" width="300" /></Link>
    <section className="auth-card">
      <div className="kicker">Join the movement</div>
      <h1>Create your account</h1>
      <p>Register as an individual, volunteer, school, community group or organisation.</p>
      <RegisterForm />
      <p><Link href="/verify">Email verification information</Link></p>
    </section>
  </main>;
}