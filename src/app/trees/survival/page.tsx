"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Tree = { id: string; tree_code: string; species_name: string; planted_on: string };
type Log = { id: string; tree_id: string; milestone: string; status: string; observed_on: string; reviewer_approved: boolean };

export default function SurvivalMonitoringPage() {
  const [trees,setTrees] = useState<Tree[]>([]);
  const [logs,setLogs] = useState<Log[]>([]);
  const [treeId,setTreeId] = useState("");
  const [milestone,setMilestone] = useState("30_day");
  const [status,setStatus] = useState("healthy");
  const [observedOn,setObservedOn] = useState(new Date().toISOString().slice(0,10));
  const [height,setHeight] = useState("");
  const [canopy,setCanopy] = useState("");
  const [latitude,setLatitude] = useState("");
  const [longitude,setLongitude] = useState("");
  const [notes,setNotes] = useState("");
  const [file,setFile] = useState<File|null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("Loading your tree records…");

  useEffect(()=>{ void (async()=>{
    const supabase=getSupabaseBrowserClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setMessage("Sign in to submit survival monitoring.");return;}
    const [{data:treeData,error:treeError},{data:logData,error:logError}]=await Promise.all([
      supabase.from("tree_registry").select("id,tree_code,species_name,planted_on").eq("created_by",user.id).order("created_at",{ascending:false}).limit(200),
      supabase.from("tree_survival_logs").select("id,tree_id,milestone,status,observed_on,reviewer_approved").eq("reporter_id",user.id).order("created_at",{ascending:false}).limit(100)
    ]);
    if(treeError) throw treeError;if(logError) throw logError;
    setTrees((treeData??[]) as Tree[]);setLogs((logData??[]) as Log[]);
    if(treeData?.[0]) setTreeId(treeData[0].id);
    setMessage(treeData?.length ? "Choose a tree and submit a dated observation with a photograph." : "No trees registered under your account yet. Register a tree first.");
  })().catch((error)=>setMessage(error instanceof Error?error.message:"Could not load monitoring records."));},[]);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!treeId||!file)return;
    if(!file.type.startsWith("image/")||file.size>10*1024*1024){setMessage("Choose a JPEG, PNG or WebP photograph up to 10 MB.");return;}
    setBusy(true);setMessage("");
    const supabase=getSupabaseBrowserClient();
    let uploadedPath="";
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session) throw new Error("Please sign in again.");
      const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
      uploadedPath=`${session.user.id}/survival/${treeId}/${crypto.randomUUID()}.${ext}`;
      const {error:uploadError}=await supabase.storage.from("community-media").upload(uploadedPath,file,{contentType:file.type,upsert:false});
      if(uploadError) throw uploadError;
      const response=await fetch("/api/trees/survival",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({tree_id:treeId,milestone,status,observed_on:observedOn,growth_height_cm:height,canopy_spread_cm:canopy,gps_latitude:latitude,gps_longitude:longitude,evidence_media_path:uploadedPath,damage_or_disease_notes:notes})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Monitoring submission failed.");
      setLogs((current)=>[result.log as Log,...current]);setHeight("");setCanopy("");setNotes("");setFile(null);
      setMessage("Observation submitted for review. It is not counted as verified survival until an authorised reviewer approves it.");
    }catch(error){
      if(uploadedPath) await supabase.storage.from("community-media").remove([uploadedPath]);
      setMessage(error instanceof Error?error.message:"Unable to submit this observation.");
    }finally{setBusy(false);}
  }
  const field="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900";
  return <main className="portal"><header><Link href="/trees/register">← Tree registration</Link><Link href="/projects">Projects</Link></header>
    <section className="portal-hero"><p className="kicker">After planting comes care</p><h1>Tree survival monitoring</h1><p>Submit dated observations over time. Reports remain private and unverified until reviewed.</p></section>
    <form onSubmit={submit} className="mx-auto my-8 grid max-w-3xl gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="grid gap-2 font-medium">Your registered tree *<select className={field} value={treeId} onChange={(e)=>setTreeId(e.target.value)} required><option value="">Select a tree</option>{trees.map((t)=><option key={t.id} value={t.id}>{t.tree_code} — {t.species_name}</option>)}</select></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 font-medium">Monitoring milestone *<select className={field} value={milestone} onChange={(e)=>setMilestone(e.target.value)}>{[["initial_planting","Initial planting"],["30_day","30 days"],["90_day","90 days"],["6_month","6 months"],["12_month","12 months"],["annual","Annual"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="grid gap-2 font-medium">Observation date *<input className={field} type="date" required value={observedOn} onChange={(e)=>setObservedOn(e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Observed condition *<select className={field} value={status} onChange={(e)=>setStatus(e.target.value)}>{[["healthy","Healthy"],["stressed","Stressed"],["damaged_recoverable","Damaged — recoverable"],["dead_lost","Dead / lost"],["replaced","Replaced"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="grid gap-2 font-medium">Height (cm)<input className={field} type="number" min="0" step="0.1" value={height} onChange={(e)=>setHeight(e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Canopy spread (cm)<input className={field} type="number" min="0" step="0.1" value={canopy} onChange={(e)=>setCanopy(e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Latitude (optional)<input className={field} type="number" min="-90" max="90" step="any" value={latitude} onChange={(e)=>setLatitude(e.target.value)} /></label>
        <label className="grid gap-2 font-medium">Longitude (optional)<input className={field} type="number" min="-180" max="180" step="any" value={longitude} onChange={(e)=>setLongitude(e.target.value)} /></label>
      </div>
      <label className="grid gap-2 font-medium">Photograph evidence *<input className={field} type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e)=>setFile(e.target.files?.[0]??null)} /><small className="font-normal text-slate-500">JPEG, PNG or WebP; maximum 10 MB. Stored privately.</small></label>
      <label className="grid gap-2 font-medium">Damage, disease or care notes<textarea className={field} rows={4} maxLength={3000} value={notes} onChange={(e)=>setNotes(e.target.value)} /></label>
      <button className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={busy||!trees.length}>{busy?"Submitting…":"Submit observation for review"}</button>
      <p role="status" aria-live="polite" className="rounded-lg bg-slate-100 p-3 text-sm">{message}</p>
    </form>
    <section className="mx-auto my-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Your monitoring history</h2>{logs.length?logs.map((log)=><article key={log.id} className="border-b border-slate-100 py-3"><b>{trees.find((t)=>t.id===log.tree_id)?.tree_code??"Tree"}</b><p>{log.milestone.replace("_"," ")} · {log.status.replaceAll("_"," ")} · {log.observed_on}</p><small>{log.reviewer_approved?"Reviewed and approved":"Pending review"}</small></article>):<p className="py-3 text-slate-600">No observations submitted yet.</p>}</section>
  </main>;
}
