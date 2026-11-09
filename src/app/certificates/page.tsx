import Link from "next/link";
export const metadata = { title: "Certificate preview | 200 Billion Trees", description: "A demonstration of the planned formal certificate design. Not an issued credential." };
export default function Certificates() {
  return <main className="portal certificate-page">
    <header><Link href="/">← 200 Billion Trees</Link><Link href="/community">Community</Link><Link href="/projects">Projects</Link></header>
    <section className="portal-hero"><p className="kicker">Recognition with integrity</p><h1>Certificates & verification</h1><p>A formal certificate design for future authorised recognition. Real certificates will be issued only after participation or project records have been reviewed and approved.</p></section>
    <section className="certificate-demo"><article className="certificate-sheet"><div className="certificate-inner">
      <div className="cert-topline"><span>ENTIRE SPACE ABSOLUTE FOUNDATION</span><span>SECTION 8 COMPANY · INDIA</span></div>
      <div className="cert-emblem" aria-hidden="true"><span>ESAF</span><small>200BT</small></div>
      <p className="cert-overline">200 BILLION TREES · A GLOBAL GREEN MOVEMENT</p><div className="cert-rule"><i/></div>
      <h2>Certificate of Appreciation</h2><p className="cert-intro">This demonstration certificate recognises the contribution of</p>
      <h3 className="cert-name">DEMO PARTICIPANT</h3>
      <p className="cert-description">For participation in a community-led tree planting and care activity, and for supporting responsible environmental stewardship.</p>
      <p className="cert-motto">“Together for a Greener, Healthier and Peaceful World”</p>
      <div className="cert-bottom"><div><span className="cert-sign-line"/><strong>Authorised Signatory</strong><small>To be assigned after formal approval</small></div><div className="cert-seal"><span>DEMO</span><small>NOT VALID</small></div><div><span className="cert-sign-line"/><strong>Issuing Organisation</strong><small>Entire Space Absolute Foundation</small></div></div>
      <div className="cert-foot"><span>DEMO ID: 200BT-DEMO-0001</span><span>ISSUE DATE: NOT ISSUED</span><span>QR VERIFICATION: NOT ACTIVE</span></div>
    </div><div className="cert-watermark">DEMONSTRATION COPY</div></article></section>
    <section className="portal-note"><b>Important:</b> This is a design sample only. It is not an official issued certificate, proof of planting, or proof of participation. Live issuance will require verified records, an authorised signatory, a unique certificate number, revocation controls and a working public verification page. <Link href="/verify">Verification information →</Link></section>
  </main>;
}