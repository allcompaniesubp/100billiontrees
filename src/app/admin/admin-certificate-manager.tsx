"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = { id: string; display_name: string | null; role: string; approval_status: string };
type Certificate = { id: string; certificate_number: string; recipient_id: string; recipient_name_snapshot: string; certificate_type: string; status: string; issued_at: string | null; verification_code: string };
type TreeRecord = { id: string; tree_code: string; project_id: string; species_name: string; planted_on: string; latitude: number; longitude: number; verification_status: string };

export default function AdminCertificateManager() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientWhatsApp, setRecipientWhatsApp] = useState("");
  const [certificateType, setCertificateType] = useState("Certificate of Appreciation");
  const [deliveryTargets, setDeliveryTargets] = useState<Record<string, { email: string; whatsapp: string }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Checking administrator access…");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!auth.user) { setAllowed(false); setMessage("Sign in with an authorised administrator account."); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("role,approval_status").eq("id", auth.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "administrator" || profile.approval_status !== "approved") {
      setAllowed(false);
      setMessage("Access restricted. This account is not an approved administrator. Ask the Foundation account owner to assign administrator access securely.");
      setLoading(false);
      return;
    }
    setAllowed(true);
    const [{ data: people, error: peopleError }, { data: certs, error: certError }, { data: treeRows, error: treeError }] = await Promise.all([
      supabase.from("profiles").select("id,display_name,role,approval_status").order("created_at", { ascending: false }),
      supabase.from("certificates").select("id,certificate_number,recipient_id,recipient_name_snapshot,certificate_type,status,issued_at,verification_code").order("created_at", { ascending: false }).limit(100),
      supabase.from("tree_registry").select("id,tree_code,project_id,species_name,planted_on,latitude,longitude,verification_status").order("created_at", { ascending: false }).limit(100),
    ]);
    if (peopleError) throw peopleError;
    if (certError) throw certError;
    if (treeError) throw treeError;
    setProfiles((people ?? []) as Profile[]);
    setCertificates((certs ?? []) as Certificate[]);
    setTrees((treeRows ?? []) as TreeRecord[]);
    setLoading(false);
    setMessage("Administrator access verified. Certificate issuance is enabled.");
  }

  useEffect(() => { void load().catch((error) => { setMessage(error instanceof Error ? error.message : "Could not load administrator tools."); setLoading(false); }); }, []);

  function chooseRecipient(id: string) {
    setRecipientId(id);
    const selected = profiles.find((person) => person.id === id);
    setRecipientName(selected?.display_name ?? "");
  }

  async function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipientId || !recipientName.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await getSupabaseBrowserClient().from("certificates").insert({
        recipient_id: recipientId,
        recipient_name_snapshot: recipientName.trim(),
        certificate_type: certificateType,
        status: "draft",
      }).select("id,certificate_number,recipient_id,recipient_name_snapshot,certificate_type,status,issued_at,verification_code").single();
      if (error) throw error;
      setCertificates((current) => [data as Certificate, ...current]);
      setDeliveryTargets((current) => ({ ...current, [data.id]: { email: recipientEmail, whatsapp: recipientWhatsApp } }));
      setMessage("Draft created: " + data.certificate_number + ". Review the recipient and evidence before issuing.");
    } catch (error) {
      setMessage(error instanceof Error ? "Could not create certificate: " + error.message : "Could not create certificate.");
    } finally { setBusy(false); }
  }

  async function issue(id: string) {
    if (!window.confirm("Issue this certificate now? Issued certificates become publicly verifiable.")) return;
    setBusy(true);
    try {
      const { data, error } = await getSupabaseBrowserClient().from("certificates")
        .update({ status: "issued", issued_at: new Date().toISOString() })
        .eq("id", id).eq("status", "draft")
        .select("id,certificate_number,recipient_id,recipient_name_snapshot,certificate_type,status,issued_at,verification_code").single();
      if (error) throw error;
      setCertificates((current) => current.map((item) => item.id === id ? data as Certificate : item));
      setMessage("Certificate issued: " + data.certificate_number + ". Use the email or WhatsApp actions to share its verification page.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not issue certificate.");
    } finally { setBusy(false); }
  }

  async function reviewTree(id: string, status: "under_review" | "verified" | "rejected") {
    setBusy(true);
    try {
      const { data: auth } = await getSupabaseBrowserClient().auth.getUser();
      if (!auth.user) throw new Error("Please sign in again.");
      const { data, error } = await getSupabaseBrowserClient().from("tree_registry")
        .update({ verification_status: status, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() })
        .eq("id", id).select("id,tree_code,project_id,species_name,planted_on,latitude,longitude,verification_status").single();
      if (error) throw error;
      setTrees((current) => current.map((tree) => tree.id === id ? data as TreeRecord : tree));
      setMessage("Tree " + data.tree_code + " updated to " + status.replace("_", " ") + ".");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update tree verification."); }
    finally { setBusy(false); }
  }

  function shareUrl(code: string) { return window.location.origin + "/certificate/" + encodeURIComponent(code); }
  function emailDraft(cert: Certificate) {
    const email = deliveryTargets[cert.id]?.email ?? "";
    if (!email) { setMessage("Enter this recipient’s email when creating the certificate to prepare an email draft."); return; }
    const subject = encodeURIComponent("Your 200 Billion Trees certificate — " + cert.certificate_number);
    const body = encodeURIComponent("Dear " + cert.recipient_name_snapshot + ",\n\nYour certificate has been issued by Entire Space Absolute Foundation.\nCertificate number: " + cert.certificate_number + "\nVerify it here: " + shareUrl(cert.verification_code) + "\n\nTogether for a Greener, Healthier and Peaceful World.");
    window.location.href = "mailto:" + encodeURIComponent(email) + "?subject=" + subject + "&body=" + body;
  }
  function whatsappDraft(cert: Certificate) {
    const phone = (deliveryTargets[cert.id]?.whatsapp ?? "").replace(/[^0-9]/g, "");
    if (!phone) { setMessage("Enter this recipient’s WhatsApp number when creating the certificate to prepare a WhatsApp message."); return; }
    const message = encodeURIComponent("Hello " + cert.recipient_name_snapshot + ", your 200 Billion Trees certificate " + cert.certificate_number + " has been issued. Verify it here: " + shareUrl(cert.verification_code));
    window.open("https://wa.me/" + phone + "?text=" + message, "_blank", "noopener,noreferrer");
  }

  if (loading) return <section className="admin-shell"><p role="status">{message}</p></section>;
  if (!allowed) return <section className="admin-shell admin-denied"><h2>Administrator access required</h2><p role="status">{message}</p><a href="/sign-in">Sign in</a></section>;

  return <section className="admin-shell">
    <p className="admin-status" role="status" aria-live="polite">{message}</p>
    <div className="admin-grid">
      <article className="admin-stat"><span>Registered members</span><strong>{profiles.length}</strong></article>
      <article className="admin-stat"><span>Certificates</span><strong>{certificates.length}</strong></article>
      <article className="admin-stat"><span>Issued</span><strong>{certificates.filter((c) => c.status === "issued").length}</strong></article>
      <article className="admin-stat"><span>Drafts</span><strong>{certificates.filter((c) => c.status === "draft").length}</strong></article>
    </div>
    <form className="admin-card admin-create" onSubmit={createDraft}>
      <div><span className="kicker">Certificate centre</span><h2>Create a certificate draft</h2><p>Issue only after participation or planting evidence has been checked and approved.</p></div>
      <label>Recipient<select value={recipientId} onChange={(e) => chooseRecipient(e.target.value)} required><option value="">Select a member</option>{profiles.map((person) => <option key={person.id} value={person.id}>{person.display_name || "Member"} · {person.approval_status}</option>)}</select></label>
      <label>Recipient name<input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required maxLength={160} /></label>
      <label>Certificate type<select value={certificateType} onChange={(e) => setCertificateType(e.target.value)}><option>Certificate of Appreciation</option><option>Certificate of Participation</option><option>Tree Planting Contribution</option><option>Volunteer Service</option><option>Project Partnership</option></select></label>
      <div className="admin-contact-grid">
        <label>Recipient email (for a prefilled email draft)<input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="name@example.com" /></label>
        <label>WhatsApp number with country code<input value={recipientWhatsApp} onChange={(e) => setRecipientWhatsApp(e.target.value)} placeholder="919876543210" /></label>
      </div>
      <button className="admin-primary" type="submit" disabled={busy || !recipientId}>{busy ? "Saving…" : "Create certificate draft"}</button>
    </form>
    <div className="admin-card">
      <div className="admin-list-heading"><div><span className="kicker">Tree evidence review</span><h2>Individual tree registry</h2></div><span>{trees.length} records</span></div>
      {trees.length ? trees.map((tree) => <article className="admin-cert-row" key={tree.id}>
        <div className="admin-cert-main"><strong>{tree.tree_code}</strong><span>{tree.species_name} · planted {new Date(tree.planted_on + "T00:00:00").toLocaleDateString()}</span><small>{tree.verification_status.replace("_"," ")} · {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}</small><a href={"https://www.google.com/maps?q=" + tree.latitude + "," + tree.longitude} target="_blank" rel="noreferrer">Open GPS location ↗</a></div>
        <div className="admin-cert-actions"><button type="button" disabled={busy} onClick={() => void reviewTree(tree.id,"under_review")}>Under review</button><button type="button" disabled={busy} onClick={() => void reviewTree(tree.id,"verified")}>Verify tree</button><button type="button" disabled={busy} onClick={() => void reviewTree(tree.id,"rejected")}>Reject</button></div>
      </article>) : <p>No individual tree records have been submitted yet.</p>}
    </div>
    <div className="admin-card">
      <div className="admin-list-heading"><div><span className="kicker">Issuance register</span><h2>Certificates</h2></div><span>{certificates.length} records</span></div>
      {certificates.length ? certificates.map((cert) => <article className="admin-cert-row" key={cert.id}>
        <div className="admin-cert-main"><strong>{cert.certificate_number}</strong><span>{cert.recipient_name_snapshot} · {cert.certificate_type}</span><small>{cert.status}{cert.issued_at ? " · " + new Date(cert.issued_at).toLocaleDateString() : ""}</small></div>
        <div className="admin-cert-actions">
          {cert.status === "draft" ? <button type="button" disabled={busy} onClick={() => void issue(cert.id)}>Issue</button> : <>
            <a href={"/certificate/" + encodeURIComponent(cert.verification_code)} target="_blank" rel="noreferrer">View / print</a>
            <button type="button" onClick={() => emailDraft(cert)} disabled={!deliveryTargets[cert.id]?.email}>Email draft</button>
            <button type="button" onClick={() => whatsappDraft(cert)} disabled={!deliveryTargets[cert.id]?.whatsapp.replace(/[^0-9]/g,"")}>WhatsApp</button>
          </>}
        </div>
      </article>) : <p>No certificates have been created.</p>}
    </div>
    <p className="admin-disclaimer">Email and WhatsApp buttons open prefilled drafts for a human to review and send. Automatic delivery requires a verified sending domain and an approved WhatsApp Business API integration; neither is activated yet.</p>
  </section>;
}
