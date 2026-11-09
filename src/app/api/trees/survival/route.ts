import { NextResponse } from "next/server";
import { createUserScopedSupabase, getBearerToken } from "@/lib/supabase/api-client";

export const runtime = "nodejs";

const milestones = ["initial_planting", "30_day", "90_day", "6_month", "12_month", "annual"];
const statuses = ["healthy", "stressed", "damaged_recoverable", "dead_lost", "replaced"];

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    const supabase = createUserScopedSupabase(token);
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Your session is invalid." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("profiles").select("approval_status").eq("id", auth.user.id).single();\n    if (profileError || profile?.approval_status !== "approved") return NextResponse.json({ error: "Your account must be approved to submit monitoring reports." }, { status: 403 });\n    const body = await request.json();
    const treeId = typeof body.tree_id === "string" ? body.tree_id : "";
    const milestone = typeof body.milestone === "string" ? body.milestone : "";
    const status = typeof body.status === "string" ? body.status : "healthy";
    const evidencePath = typeof body.evidence_media_path === "string" ? body.evidence_media_path : "";
    if (!/^[0-9a-f-]{36}$/i.test(treeId) || !milestones.includes(milestone) || !statuses.includes(status) ||
        !evidencePath.startsWith(`${auth.user.id}/survival/${treeId}/`) || evidencePath.length > 500) {
      return NextResponse.json({ error: "Tree, milestone, status or private evidence reference is invalid." }, { status: 400 });
    }
    const numberOrNull = (value: unknown) => {
      if (value === "" || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
    };
    const height = numberOrNull(body.growth_height_cm), canopy = numberOrNull(body.canopy_spread_cm);
    const lat = body.gps_latitude === "" || body.gps_latitude == null ? null : Number(body.gps_latitude);
    const lng = body.gps_longitude === "" || body.gps_longitude == null ? null : Number(body.gps_longitude);
    if ([height, canopy].some(Number.isNaN) || (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
        (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) || ((lat === null) !== (lng === null))) {
      return NextResponse.json({ error: "Growth measurements or GPS coordinates are invalid." }, { status: 400 });
    }
    const { data: object } = await supabase.storage.from("community-media").list(
      `${auth.user.id}/survival/${treeId}`, { search: evidencePath.split("/").pop(), limit: 10 }
    );
    if (!object?.some((item) => item.name === evidencePath.split("/").pop())) {
      return NextResponse.json({ error: "Upload the evidence photograph before submitting the monitoring report." }, { status: 400 });
    }
    const { data, error } = await supabase.from("tree_survival_logs").insert({
      tree_id: treeId, reporter_id: auth.user.id, milestone, status,
      growth_height_cm: height, canopy_spread_cm: canopy,
      gps_latitude: lat, gps_longitude: lng,
      evidence_media_path: evidencePath,
      damage_or_disease_notes: typeof body.damage_or_disease_notes === "string" ? body.damage_or_disease_notes.trim().slice(0, 3000) : null,
      observed_on: typeof body.observed_on === "string" ? body.observed_on : new Date().toISOString().slice(0, 10),
      reviewer_approved: false,
    }).select("id,tree_id,milestone,status,observed_on,reviewer_approved,created_at").single();
    if (error) return NextResponse.json({ error: "Monitoring report could not be saved. " + error.message }, { status: 400 });
    return NextResponse.json({ success: true, log: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request or server configuration." }, { status: 400 });
  }
}
