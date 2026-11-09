"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CreateProjectPage() {
  const [form, setForm] = useState({ title: "", description: "", country: "", state_province: "", district: "", locality: "", partner_organisation: "", start_date: new Date().toISOString().slice(0,10), expected_completion_date: "", tree_target: "1000", land_ownership_status: "Community Land", supported_species: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
      if (!session) throw new Error("Please sign in before submitting a project.");
      const response = await fetch("/api/projects/create", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ ...form, tree_target: Number(form.tree_target), supported_species: form.supported_species.split(",").map((s) => s.trim()).filter(Boolean) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Project submission failed.");
      setMessage(`Project submitted for review. Reference: ${result.project.id}`);
      setForm((current) => ({ ...current, title: "", description: "", supported_species: "" }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit project."); }
    finally { setBusy(false); }
  }
  const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900";
  return <main className="portal"><header><Link href="/projects">← Projects</Link><Link href="/trees/register">Register a tree</Link></header>
    <section className="portal-hero"><p className="kicker">Project proposal</p><h1>Register a planting project</h1><p>Submit the project for review. Tree registration is enabled only after the project is approved.</p></section>
    <form onSubmit={submit} className="mx-auto my-8 grid max-w-3xl gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="grid gap-2 font-medium">Project title *<input className={field} required minLength={3} maxLength={160} value={form.title} onChange={(e)=>update("title",e.target.value)} /></label>
      <label className="grid gap-2 font-medium">Description *<textarea className={field} required minLength={20} maxLength={5000} rows={5} value={form.description} onChange={(e)=>update("description",e.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 font-medium">Country *<input className={field} required value={form.country} onChange={(e)=>update("country",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">State / Province<input className={field} value={form.state_province} onChange={(e)=>update("state_province",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">District<input className={field} value={form.district} onChange={(e)=>update("district",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Locality / Site<input className={field} value={form.locality} onChange={(e)=>update("locality",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Implementing partner<input className={field} value={form.partner_organisation} onChange={(e)=>update("partner_organisation",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Tree target *<input className={field} type="number" min="1" max="100000000" required value={form.tree_target} onChange={(e)=>update("tree_target",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Start date *<input className={field} type="date" required value={form.start_date} onChange={(e)=>update("start_date",e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Expected completion<input className={field} type="date" value={form.expected_completion_date} onChange={(e)=>update("expected_completion_date",e.target.value)} /></label>
      </div>
      <label className="grid gap-2 font-medium">Land ownership / permission status *<select className={field} value={form.land_ownership_status} onChange={(e)=>update("land_ownership_status",e.target.value)}><option>Community Land</option><option>Government Forest Reserve</option><option>Private Farmland</option><option>Institutional Campus</option><option>Other</option></select></label>
      <label className="grid gap-2 font-medium">Proposed species (comma-separated)<input className={field} value={form.supported_species} onChange={(e)=>update("supported_species",e.target.value)} placeholder="Local native species names" /></label>
      <p className="text-sm text-slate-600">Submitting a proposal does not confirm land permission or ecological approval. Uploading supporting documents and project imagery will be enabled in a subsequent evidence workflow. Do not submit sensitive personal documents in this form.</p>
      <button className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? "Submitting…" : "Submit project for review"}</button>
      {message && <p role="status" aria-live="polite" className="rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
    </form>
  </main>;
}
