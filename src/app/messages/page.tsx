import Link from "next/link";
import Messaging from "./messaging";

export const metadata = {
  title: "Messages | 200 Billion Trees",
  description: "Send a private message to the 200 Billion Trees Foundation team.",
};

export default function MessagesPage() {
  return <main className="portal messages-page">
    <header><Link href="/">← 200 Billion Trees</Link><Link href="/community">Community</Link><Link href="/projects">Projects</Link></header>
    <section className="portal-hero">
      <p className="kicker">Member support</p>
      <h1>Messages</h1>
      <p>Contact the Foundation about membership, community uploads, project registration or tree-planting evidence. Replies stay private to your account and authorised Foundation staff.</p>
    </section>
    <Messaging />
    <footer><div className="footer-inner"><div><strong>200 Billion Trees</strong><p>Initiated by Entire Space Absolute Foundation</p></div><p><Link href="/">Home</Link>　·　<Link href="/community">Community</Link>　·　<Link href="/legal-status">Organisation details</Link></p></div></footer>
  </main>;
}
