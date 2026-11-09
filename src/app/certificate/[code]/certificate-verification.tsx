"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Cert = { certificate_number: string; recipient_name_snapshot: string; certificate_type: string; status: string; issued_at: string | null; verification_code: string };

export default function CertificateVerification({ code }: { code: string }) {
  const [certificate, setCertificate] = useState<Cert | null>(null);
  const [message, setMessage] = useState("Checking the certificate register…");
  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient().from("public_certificate_verification")
      .select("certificate_number,recipient_name_snapshot,certificate_type,status,issued_at,verification_code")
      .eq("verification_code", code).eq("status", "issued").maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMessage("The verification service is temporarily unavailable.");
        else if (!data) setMessage("No issued certificate matches this verification code. Check the code or contact the Foundation.");
        else { setCertificate(data as Cert); setMessage("This certificate is recorded as issued in the Foundation register."); }
      });
    return () => { active = false; };
  }, [code]);
  return <section className="certificate-check">
    <p className="certificate-check-status" role="status">{message}</p>
    {certificate && <article className="certificate-issued">
      <span className="certificate-valid">ISSUED · REGISTER VERIFIED</span>
      <p className="kicker">Entire Space Absolute Foundation</p>
      <h2>{certificate.certificate_type}</h2>
      <p>This certificate is recorded for</p>
      <h3>{certificate.recipient_name_snapshot}</h3>
      <p>Certificate number: <strong>{certificate.certificate_number}</strong></p>
      <p>Issue date: <strong>{certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : "Not recorded"}</strong></p>
      <p>Verification code: <strong>{certificate.verification_code}</strong></p>
      <button type="button" onClick={() => window.print()}>Print certificate record</button>
      <small>This page verifies issuance status only. It does not independently prove tree survival, planting quantity or ecological outcomes.</small>
    </article>}
  </section>;
}
