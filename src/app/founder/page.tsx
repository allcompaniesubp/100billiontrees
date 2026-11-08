import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founder | Dr. Ravi Prasad Ch | 200 Billion Trees",
  description: "Meet Dr. Ravi Prasad Ch, Founder of 200 Billion Trees, an initiative of Entire Space Absolute Foundation.",
};

const qualifications = [
  "Professional Doctorate in Business Management — European International University, Paris, and East Bridge University (USA & France)",
  "Master of Science in Electronics and Communication",
  "Bachelor of Laws (LL.B.)",
  "Advanced Postgraduate Diploma in Human Rights",
  "Postgraduate Diploma in Gandhi and Peace Studies — IGNOU",
  "Law of International Organizations — United Nations Institute for Training and Research (UNITAR)",
  "Other international certificate courses and professional learning",
];

const focusAreas = [
  ["🌍", "International cooperation", "Building constructive connections across communities, institutions and countries."],
  ["⚖️", "Human rights and dignity", "Supporting awareness of human rights, peace, inclusion and responsible institutions."],
  ["🌱", "Sustainable development", "Promoting practical action aligned with climate responsibility, biodiversity and the Sustainable Development Goals."],
  ["💡", "Technology and education", "Encouraging accessible learning, innovation and technology-led solutions for public benefit."],
];

export default function FounderPage() {
  return (
    <main className="founder-page">
      <header className="site-header">
        <Link className="brand" href="/"><span className="brand-mark">✳</span><span>200 BILLION<br/><small style={{fontSize:9,letterSpacing:2,color:"#72917b"}}>TREES · GLOBAL MOVEMENT</small></span></Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/#mission">Our mission</Link>
          <Link href="/#progress">Global progress</Link>
          <Link href="/#countries">Countries</Link>
          <Link href="/founder" aria-current="page">Founder</Link>
        </nav>
        <Link className="header-cta" href="/#participate">🌿 Join the movement</Link>
      </header>

      <section className="founder-hero">
        <div className="founder-hero-inner">
          <div>
            <div className="eyebrow"><span className="dot"/> The person behind the initiative</div>
            <p className="founder-overline">FOUNDER · 200 BILLION TREES</p>
            <h1>Dr. Ravi<br/><span>Prasad Ch</span></h1>
            <p className="founder-lead">A life shaped by service, learning and a belief that meaningful progress begins when people take responsibility for the world they share.</p>
            <div className="founder-actions">
              <Link className="btn-primary" href="/#participate">Be part of the mission <span>→</span></Link>
              <Link className="btn-secondary" href="/">Explore the initiative</Link>
            </div>
          </div>
          <aside className="founder-quote">
            <span className="quote-mark">“</span>
            <p>We do not inherit the Earth only to use it. We hold it in trust for the generations who will come after us.</p>
            <small>A guiding thought behind 200 Billion Trees</small>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-inner founder-content-grid">
          <div>
            <div className="kicker">About the founder</div>
            <h2>Service. Knowledge. Responsibility.</h2>
          </div>
          <div className="founder-copy">
            <p>Dr. Ravi Prasad Ch is an Indian professional whose experience brings together public service, technology, law, management and human-rights learning. He has served in the Indian Air Force for nearly two decades, gaining experience in a disciplined, technology-oriented environment where teamwork, responsibility and service are central.</p>
            <p>Alongside his professional service, he has pursued multidisciplinary education spanning electronics and communication, business management, law, human rights, and Gandhi and Peace Studies. His Professional Doctorate in Business Management is associated with European International University, Paris, and East Bridge University (USA &amp; France). His interests include international cooperation, institutional development, education, technology and sustainable development.</p>
            <p>His international learning includes UNITAR Young Leaders engagement through the United Nations Institute for Training and Research (UNITAR), the course Law of International Organizations from UNITAR, and other international certificate courses. He is committed to exploring ways in which people, institutions and communities can work together on challenges that cross borders.</p>
          </div>
        </div>
      </section>

      <section className="section founder-education">
        <div className="section-inner">
          <div className="kicker">Academic and professional learning</div>
          <h2>A multidisciplinary foundation.</h2>
          <p className="section-desc">The following qualifications and areas of study inform his approach to service, governance, technology and social impact.</p>
          <div className="qualification-grid">
            {qualifications.map((item, index) => <div className="qualification" key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}
            <div className="qualification"><span>08</span><strong>UNITAR Young Leaders engagement — United Nations Institute for Training and Research</strong></div>
          </div>
        </div>
      </section>

      <section className="dark-band">
        <div className="section-inner">
          <div className="kicker" style={{color:"#b5dba8"}}>Areas of commitment</div>
          <h2>Connected by a public-purpose outlook.</h2>
          <div className="founder-focus-grid">
            {focusAreas.map(([icon, title, description]) => <article className="pillar" key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner founder-mission">
          <div>
            <div className="kicker">Why 200 Billion Trees</div>
            <h2>A global ambition, rooted in local action.</h2>
          </div>
          <div className="founder-copy">
            <p>Dr. Ravi Prasad Ch is the Founder of 200 Billion Trees, an initiative initiated by Entire Space Absolute Foundation. Its vision is to encourage collective action across 200 countries and territories to plant ecologically appropriate trees, protect existing natural ecosystems and support long-term tree care.</p>
            <p>The initiative aims to connect individuals, schools, universities, environmental groups, community organisations, responsible businesses and local coordinators. It places importance on locally suitable species, evidence-based reporting and follow-up monitoring—not simply the number of saplings placed in the ground.</p>
            <p>Its work is intended to contribute to global efforts associated with climate action, life on land and partnerships for sustainable development. The initiative is independent and does not claim to be an official United Nations or government programme.</p>
          </div>
        </div>
      </section>

      <section className="founder-bottom">
        <div className="section-inner">
          <p className="kicker">A shared responsibility</p>
          <h2>The future grows through what we do today.</h2>
          <p>Join communities working to plant wisely, protect nature and care for trees beyond planting day.</p>
          <Link className="btn-primary" href="/#participate">Explore how to participate →</Link>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div><Link className="brand" href="/"><span className="brand-mark">✳</span>200 BILLION TREES</Link><p>One planet. One human family. One green future.</p></div>
          <div><strong>Initiated by Entire Space Absolute Foundation</strong><p>Founder: Dr. Ravi Prasad Ch</p><p><Link href="/">Home</Link>　·　<Link href="/#mission">Our mission</Link>　·　<Link href="/founder">Founder</Link></p></div>
        </div>
        <div className="disclaimer">Biographical information is provided for public introduction. This independent initiative does not imply endorsement by the United Nations or any government. Official contact details will be added after confirmation by the Foundation.</div>
      </footer>
    </main>
  );
}
