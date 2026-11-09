import Link from "next/link";
import TreeRegistrationForm from "./tree-registration-form";

export const metadata = {
  title: "Register a tree | 200 Billion Trees",
  description: "Register an individual tree with GPS coordinates and planting details.",
};

export default function RegisterTreePage() {
  return <main className="portal tree-register-page">
    <header><Link href="/">← 200 Billion Trees</Link><Link href="/trees">Tree catalogue</Link><Link href="/community">Community</Link></header>
    <section className="portal-hero">
      <p className="kicker">One tree · one record · one location</p>
      <h1>Register an individual tree</h1>
      <p>Every tree receives a unique 200BT ID and its own GPS location. Records remain submitted until evidence is reviewed by an authorised verifier.</p>
    </section>
    <TreeRegistrationForm />
    <section className="portal-note"><b>Location privacy:</b> exact coordinates are visible only to the project owner and authorised Foundation reviewers. Public maps should use approximate locations after verification.</section>
  </main>;
}
