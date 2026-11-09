import Link from "next/link";
import CertificateVerification from "./certificate-verification";

export const metadata = { title: "Certificate verification | 200 Billion Trees", robots: { index: true, follow: true } };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <main className="portal certificate-verify-page">
    <header><Link href="/">← 200 Billion Trees</Link><Link href="/certificates">Certificates</Link></header>
    <section className="portal-hero"><p className="kicker">Credential verification</p><h1>Certificate verification</h1><p>Check the official status of a certificate issued by Entire Space Absolute Foundation.</p></section>
    <CertificateVerification code={code} />
  </main>;
}
