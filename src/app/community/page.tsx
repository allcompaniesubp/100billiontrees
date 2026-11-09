import Link from "next/link";
import ShareActions from "./share-actions";
import CommunityMedia from "./community-media";

export const metadata = {
  title: "Community | 200 Billion Trees",
  description: "Share tree planting stories, photos and videos with the 200 Billion Trees community.",
};

export default function Community() {
  return <main className="portal community-page">
    <header><Link href="/">← 200 Billion Trees</Link><Link href="/projects">Projects</Link><Link href="/certificates">Certificates</Link></header>
    <section className="portal-hero community-hero">
      <p className="kicker">A community that grows together</p>
      <h1>Share your green journey.</h1>
      <p>Bring your planting groups, schools, volunteers and local organisations together. Share photos, short videos and updates that show the work of planting, protecting and caring for trees.</p>
      <ShareActions />
    </section>
    <section className="community-intro">
      <div><span>📸</span><h2>Photo stories</h2><p>Share planting-day moments, native species, restoration work and follow-up photographs.</p></div>
      <div><span>🎥</span><h2>Video updates</h2><p>Show your community in action with short videos about planting, maintenance and learning.</p></div>
      <div><span>🌱</span><h2>Care over time</h2><p>Post 30-, 90- and 365-day updates so that tree survival is not confused with planting counts.</p></div>
    </section>
    <CommunityMedia />
    <section className="community-guidelines">
      <div><p className="kicker">Community guidelines</p><h2>Share with care.</h2></div>
      <ul>
        <li>Upload only photographs and videos you own or have permission to share.</li>
        <li>Obtain clear consent before posting identifiable people, especially children.</li>
        <li>Do not publish private addresses, phone numbers or sensitive location details.</li>
        <li>All new media stays private until a moderator approves it.</li>
        <li>Planting claims and survival figures are reviewed separately before being marked verified.</li>
      </ul>
    </section>
    <section className="portal-note"><b>Media safety:</b> Uploads use private storage, a 50 MB file limit and approved image/video formats. Public access is restricted to moderator-approved posts. New accounts require membership approval before uploading.</section>
    <footer><div className="footer-inner"><div><strong>200 Billion Trees</strong><p>Initiated by Entire Space Absolute Foundation</p></div><p><Link href="/">Home</Link>　·　<Link href="/founder">Founder</Link>　·　<Link href="/legal-status">Organisation details</Link></p></div></footer>
  </main>;
}