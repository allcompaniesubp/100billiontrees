"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Project = { id: string; project_name: string; project_status: string };
type TreeRecord = { id: string; tree_code: string; species_name: string; latitude: number; longitude: number; verification_status: string; created_at: string };

export default function TreeRegistrationForm() {
  const [userId, setUserId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [records, setRecords] = useState<TreeRecord[]>([]);
  const [projectId, setProjectId] = useState("");
  const [species, setSpecies] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [locationSource, setLocationSource] = useState<"gps" | "manual">("gps");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("Sign in to register trees against an approved project.");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!auth.user) { setUserId(""); setMessage("Sign in to register trees against an approved project."); return; }
    setUserId(auth.user.id);
    const { data, error } = await supabase.from("planting_projects")
      .select("id,project_name,project_status")
      .eq("owner_id", auth.user.id).eq("project_status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setProjects((data ?? []) as Project[]);
    if (!projectId && data?.[0]) setProjectId(data[0].id);
    const { data: treeData, error: treeError } = await supabase.from("tree_registry")
      .select("id,tree_code,species_name,latitude,longitude,verification_status,created_at")
      .eq("created_by", auth.user.id).order("created_at", { ascending: false }).limit(100);
    if (treeError) throw treeError;
    setRecords((treeData ?? []) as TreeRecord[]);
    setMessage(data?.length
      ? "GPS capture is ready. Register each tree separately so every tree receives its own unique ID."
      : "No approved project is linked to your account yet. Submit a project and wait for approval before registering trees.");
  }

  useEffect(() => { void load().catch((error) => setMessage(error instanceof Error ? error.message : "Could not load tree records.")); }, []);

  function captureLocation() {
    if (!navigator.geolocation) { setMessage("This browser does not support GPS. Enter the coordinates manually."); return; }
    setLocating(true);
    setMessage("Requesting location permission…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setAccuracy(String(Math.round(position.coords.accuracy)));
        setLocationSource("gps");
        setLocating(false);
        setMessage("GPS location captured. Check the pin coordinates before submitting.");
      },
      (error) => {
        setLocating(false);
        setLocationSource("manual");
        setMessage(error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. You can enter latitude and longitude manually."
          : "GPS could not determine your location. Try again outdoors or enter coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !projectId) return;
    const lat = Number(latitude), lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setMessage("Enter valid GPS coordinates before submitting."); return;
    }
    setBusy(true);
    try {
      const { data, error } = await getSupabaseBrowserClient().from("tree_registry").insert({
        project_id: projectId,
        species_name: species.trim(),
        planted_on: date,
        latitude: lat,
        longitude: lng,
        gps_accuracy_m: accuracy ? Number(accuracy) : null,
        location_source: locationSource,
        notes: notes.trim() || null,
        created_by: userId,
        verification_status: "submitted",
      }).select("id,tree_code,species_name,latitude,longitude,verification_status,created_at").single();
      if (error) throw error;
      setRecords((current) => [data as TreeRecord, ...current]);
      setSpecies(""); setNotes("");
      setMessage("Tree registered successfully. Unique tree ID: " + data.tree_code + ". It is submitted, not yet verified.");
    } catch (error) {
      setMessage(error instanceof Error ? "Could not register tree: " + error.message : "Could not register this tree.");
    } finally { setBusy(false); }
  }

  if (!userId) return <section className="tree-register-card"><p role="status">{message}</p><a href="/sign-in" className="tree-action">Sign in</a></section>;

  return <section className="tree-register-wrap">
    <form className="tree-register-card" onSubmit={submit}>
      <h2>Tree details</h2>
      <p className="tree-helper">Create one record for each individual tree. Do not enter a batch quantity here.</p>
      <label>Approved planting project<select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
        <option value="">Choose project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
      </select></label>
      <label>Tree species<input value={species} onChange={(e) => setSpecies(e.target.value)} minLength={2} maxLength={160} placeholder="e.g. Azadirachta indica (Neem)" required /></label>
      <label>Planting date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
      <div className="tree-gps-box">
        <div><strong>GPS location</strong><p>Allow location access while standing near the tree.</p></div>
        <button type="button" onClick={captureLocation} disabled={locating}>{locating ? "Finding GPS…" : "◎ Capture GPS location"}</button>
        <div className="tree-coordinates">
          <label>Latitude<input type="number" step="any" value={latitude} onChange={(e) => {setLatitude(e.target.value);setLocationSource("manual");}} placeholder="e.g. 17.6868" required /></label>
          <label>Longitude<input type="number" step="any" value={longitude} onChange={(e) => {setLongitude(e.target.value);setLocationSource("manual");}} placeholder="e.g. 83.2185" required /></label>
        </div>
        <small>{accuracy ? "GPS accuracy approximately " + accuracy + " metres" : locationSource === "manual" ? "Manual coordinates" : "GPS accuracy will appear here after capture"}</small>
      </div>
      <label>Notes (optional)<textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} placeholder="Sapling size, site conditions or care notes" /></label>
      <button className="tree-action" type="submit" disabled={busy || !projectId || !projects.length}>{busy ? "Registering…" : "Register this tree"}</button>
      <p className="tree-form-status" role="status" aria-live="polite">{message}</p>
    </form>
    <div className="tree-register-card tree-record-list"><h2>Your tree records</h2>{records.length ? records.map((tree) => <article key={tree.id}>
      <div><strong>{tree.tree_code}</strong><span>{tree.species_name}</span></div>
      <small>{tree.latitude.toFixed(5)}, {tree.longitude.toFixed(5)} · {tree.verification_status.replace("_"," ")}</small>
    </article>) : <p className="tree-helper">No individual tree records yet.</p>}</div>
  </section>;
}
