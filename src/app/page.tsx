import Link from "next/link";
const countries = [
  ["🇮🇳","India"],["🇺🇸","United States"],["🇧🇷","Brazil"],["🇮🇩","Indonesia"],
  ["🇨🇳","China"],["🇳🇬","Nigeria"],["🇲🇽","Mexico"],["🇦🇺","Australia"],
  ["🇰🇪","Kenya"],["🇫🇷","France"],["🇵🇭","Philippines"],["🇨🇦","Canada"]
];

const features = [
  ["🌱","Plant & register","Record a planting activity, species, location and evidence. Build a lasting record of your contribution."],
  ["📷","Photograph & protect","Return after 30 and 60 days to share follow-up photographs and record care and early survival."],
  ["🌳","Choose suitable trees","Discover locally appropriate species using regional ecology and expert-reviewed guidance."],
  ["🏅","Digital recognition","Receive a certificate after an authorised review. Every issued certificate can be checked by QR."],
  ["🤝","Bring people together","Schools, NGOs, businesses, communities and public institutions can organise responsible campaigns."],
  ["🗺️","Explore global progress","Follow country and project progress with transparent reported, verified and survival figures."]
];

export default function Home() {
  return (
    <main id="main-content">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="brand" href="/"><img src="/entire-space-absolute-foundation.svg" alt="Entire Space Absolute Foundation NGO — India" style={{width:260,maxWidth:"100%"}} /></Link>
        <nav className="nav" aria-label="Main navigation">
          <a href="#mission">Our mission</a><a href="#progress">Global progress</a><a href="#countries">Countries</a><a href="/founder">Founder</a><a href="/trees">Trees</a><a href="/donate">Donate</a><a href="/community">Community</a><a href="#participate">Get involved</a>
        </nav>
        <details className="mobile-nav"><summary aria-label="Open navigation menu">Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation"><a href="#mission">Our mission</a><a href="#progress">Global progress</a><a href="#countries">Countries</a><a href="/founder">Founder</a><a href="/trees">Trees</a><a href="/donate">Donate</a><a href="/community">Community</a><a href="#participate">Get involved</a></nav></details>
        <a className="header-cta" href="/sign-in">Sign in / Register</a>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow"><span className="dot"/> A global movement for a living planet</div>
            <h1>One planet.<br/>A future that <span>grows.</span></h1>
            <p className="hero-copy">A shared ambition to plant, protect and nurture 200 billion trees — guided by local knowledge, ecological science and the power of people working together.</p>
            <div className="hero-actions"><a className="btn-primary" href="#participate">🌱 Plant your first tree <span>→</span></a><a className="btn-secondary" href="#mission">Discover the mission</a></div>
            <p className="hero-note">Initiated by Entire Space Absolute Foundation · Founder: Dr Ravi Prasad Ch · <a href="/founder">Meet the Founder →</a></p>
          </div>
          <div className="hero-art">
            <img src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85" alt="Sunlight filtering through a thriving green forest"/>
            <div className="art-label"><strong>Every tree matters.</strong><span>Every community can make a difference.</span></div>
          </div>
        </div>
      </section>

      <section className="section" id="progress">
        <div className="section-inner">
          <div className="section-head"><div><div className="kicker">The global ambition</div><h2>A goal that brings us together.</h2><p className="section-desc">A long-term shared target, built through locally appropriate restoration and transparent reporting. Verified progress will appear here as projects are reviewed.</p></div></div>
          <div className="stats">
            <div className="stat"><strong>200 billion</strong><span>Long-term global ambition</span><small>Movement target · not achieved count</small></div>
            <div className="stat"><strong>200 profiles</strong><span>Country & territory directory ambition</span><small>Profiles are not endorsements</small></div>
            <div className="stat"><strong>0 published</strong><span>Verified trees in this new platform</span><small>No verified records published yet</small></div>
            <div className="stat"><strong>0</strong><span>Verified country reports</span><small>Reporting begins after review</small></div>
          </div>
        </div>
      </section>

      <section className="dark-band" id="mission">
        <div className="section-inner">
          <div className="kicker" style={{color:"#b5dba8"}}>Our responsibility</div>
          <h2>Not just planting trees.<br/>Helping nature thrive.</h2>
          <p className="section-desc">A tree count alone cannot measure a healthy ecosystem. We focus on suitable species, community stewardship, biodiversity and long-term survival.</p>
          <div className="pillars">
            <article className="pillar"><div className="icon">🌍</div><h3>Restore with nature</h3><p>Support native species, local ecological knowledge and restoration approaches suited to each landscape.</p></article>
            <article className="pillar"><div className="icon">🛡️</div><h3>Protect and monitor</h3><p>Record planting evidence, follow up after 30–60 days and continue survival monitoring over time.</p></article>
            <article className="pillar"><div className="icon">🤲</div><h3>Work as one</h3><p>Connect people, schools, researchers, NGOs, responsible businesses and communities across borders.</p></article>
          </div>
        </div>
      </section>

      <section className="section" id="countries">
        <div className="section-inner">
          <div className="section-head"><div><div className="kicker">Across borders</div><h2>Every place has a part to play.</h2><p className="section-desc">Country and territory profiles will share local projects, suitable species, participating organisations and independently reviewed progress. This preview is illustrative; no country progress is claimed.</p></div></div>
          <div className="country-grid">{countries.map(([flag,name])=><div className="country" key={name}><span className="flag">{flag}</span><div><strong>{name}</strong><small>Profile planned</small></div><span className="country-empty">Not yet reported</span></div>)}</div>
          <p className="hero-note">The full directory will distinguish UN Member States, observer States and other territories using authoritative geographic reference data.</p>
        </div>
      </section>

      <section className="section" style={{background:"#f8faf7"}} id="participate">
        <div className="section-inner">
          <div className="section-head"><div><div className="kicker">Many ways to contribute</div><h2>Start where you are.</h2><p className="section-desc">Whether you plant one tree or coordinate a community restoration project, your contribution can help inspire others.</p></div></div>
          <div className="feature-grid">{features.map(([icon,title,desc])=><article className="feature" key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{desc}</p></article>)}</div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner callout">
          <div><div className="kicker">A shared promise to tomorrow</div><h2>Let&apos;s grow a future worth inheriting.</h2><p>Bring your family, school, organisation or community. Learn what belongs in your landscape, plant responsibly and help care for it long after planting day.</p></div>
          <a className="btn-primary" href="#contact">Contact the movement →</a>
        </div>
      </section>

      <footer id="contact">
        <div className="footer-inner">
          <div><div className="brand"><img src="/entire-space-absolute-foundation.svg" alt="Entire Space Absolute Foundation" style={{width:280,maxWidth:"100%"}} /></div><p>One planet. One human family. One green future.</p></div>
          <div><strong>Initiated by Entire Space Absolute Foundation</strong><p>Founder: Dr Ravi Prasad Ch · <a href="/founder">Read Founder profile</a></p><p>Contact: <a href="mailto:official.connectall.ind@gmail.com">official.connectall.ind@gmail.com</a></p><p><a href="/legal-status">Organisation legal details</a></p><p><a href="#mission">Our mission</a>　·　<a href="/countries">All countries</a>　·　<a href="/trees">Tree catalogue</a>　·　<a href="/donate">Donate</a>　·　<a href="/community">Community</a>　·　<a href="/certificates">Certificates</a>　·　<a href="/sign-in">Sign in</a></p></div>
        </div>
        <div className="disclaimer">This is an independent movement initiative. It is not an official United Nations programme or government initiative. SDG references indicate areas of contribution, not endorsement. All progress figures will be published only after their methodology and evidence are reviewed. Registered entity: ENTIRESPACE ABSOLUTE FOUNDATION, a Section 8 company incorporated under the Companies Act, 2013. This website is an independent initiative; statutory permissions and tax eligibility for public donations must be checked separately. Donation, account and media features are not yet activated.</div>
      </footer>
    </main>
  );
}
