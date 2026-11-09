import { NextResponse } from "next/server";
import { createUserScopedSupabase, getBearerToken } from "@/lib/supabase/api-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    const supabase = createUserScopedSupabase(token);
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("approval_status,role").eq("id", auth.user.id).single();
    if (profileError || !profile || profile.approval_status !== "approved") {
      return NextResponse.json({ error: "Your account must be approved before submitting a planting project." }, { status: 403 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const country = typeof body.country === "string" ? body.country.trim() : "";
    const target = Number(body.tree_target);
    const startDate = typeof body.start_date === "string" ? body.start_date : "";
    const land = typeof body.land_ownership_status === "string" ? body.land_ownership_status : "";
    const allowedLand = ["Community Land", "Government Forest Reserve", "Private Farmland", "Institutional Campus", "Other"];
    if (title.length < 3 || title.length > 160 || description.length < 20 || description.length > 5000 ||
        country.length < 2 || country.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !Number.isSafeInteger(target) || target < 1 || target > 100000000 || !allowedLand.includes(land)) {
      return NextResponse.json({ error: "Please provide a valid title, a 20–5,000 character description, country, start date, tree target and land permission status." }, { status: 400 });
    }
    const species = Array.isArray(body.supported_species)
      ? body.supported_species.filter((v: unknown): v is string => typeof v === "string").map((v: string) => v.trim()).filter(Boolean).slice(0, 40)
      : [];
    const completion = typeof body.expected_completion_date === "string" && body.expected_completion_date ? body.expected_completion_date : null;
    if (completion && completion < startDate) return NextResponse.json({ error: "Expected completion date cannot be before the start date." }, { status: 400 });

    const { data, error } = await supabase.from("planting_projects").insert({
      owner_id: auth.user.id,
      project_name: title,
      description,
      country_name: country,
      state_province: typeof body.state_province === "string" ? body.state_province.trim().slice(0, 120) : null,
      district: typeof body.district === "string" ? body.district.trim().slice(0, 120) : null,
      locality: typeof body.locality === "string" ? body.locality.trim().slice(0, 160) : null,
      site_description: typeof body.locality === "string" ? body.locality.trim().slice(0, 500) : null,
      partner_organisation: typeof body.partner_organisation === "string" ? body.partner_organisation.trim().slice(0, 180) : null,
      start_date: startDate,
      expected_completion_date: completion,
      tree_target: target,
      supported_species: species,
      land_permission_status: land === "Other" ? "not_provided" : "pending",
      ecological_review_status: "not_reviewed",
      project_status: "submitted",
      submitted_at: new Date().toISOString(),
    }).select("id,project_name,project_status,created_at").single();
    if (error) return NextResponse.json({ error: "Project could not be saved. " + error.message }, { status: 400 });
    return NextResponse.json({ success: true, project: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request or server configuration." }, { status: 400 });
  }
}
