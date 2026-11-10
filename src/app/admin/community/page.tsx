import Link from "next/link";
import CommunityModeration from "./community-moderation";

export const metadata = {
  title: "Community moderation | 200 Billion Trees",
  robots: { index: false, follow: false },
};

export default function CommunityModerationPage() {
  return <main className="portal admin-page">
    <header><Link href="/admin">← Administration</Link><Link href="/admin/projects">Project reviews</Link><Link href="/admin/survival">Survival reviews</Link><Link href="/messages">Messages</Link><Link href="/community">Public community</Link></header>
    <section className="portal-hero">
      <p className="kicker">Restricted workspace · Approved staff only</p>
      <h1>Community moderation</h1>
      <p>Review member-submitted photos, videos and captions. Approve suitable content for public display or reject it to keep it private.</p>
    </section>
    <CommunityModeration />
  </main>;
}
