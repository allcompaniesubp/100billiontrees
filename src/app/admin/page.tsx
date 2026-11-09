import Link from "next/link";
import AdminCertificateManager from "./admin-certificate-manager";

export const metadata = { title: "Administrator | 200 Billion Trees", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <main className="portal admin-page">
    <header><Link href="/">← 200 Billion Trees</Link><Link href="/community">Community</Link><Link href="/messages">Messages</Link></header>
    <section className="portal-hero"><p className="kicker">Restricted workspace</p><h1>Foundation administration</h1><p>Issue authorised certificates, manage tree verification and review platform activity. Every action is protected by database permissions and audit controls.</p></section>
    <AdminCertificateManager />
  </main>;
}
