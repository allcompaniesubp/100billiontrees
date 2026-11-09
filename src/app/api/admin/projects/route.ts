import { NextResponse } from "next/server";
import { createUserScopedSupabase, getBearerToken } from "@/lib/supabase/api-client";
export const runtime = "nodejs";

async function staffClient(request: Request) {
  const token = getBearerToken(request);
  if (!token) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const supabase = createUserScopedSupabase(token);
  const { data: auth, error } = await supabase.auth.getUser(token);
  if (error || !auth.user) return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role,approval_status").eq("id", auth.user.id).single();
  if (!profile || profile.approval_status !== "approved" || !["administrator","reviewer"].includes(profile.role))
    return { error: NextResponse.json({ error: "Administrator or reviewer access required." }, { status: 403 }) };
  return { supabase, userId: auth.user.id };
}
export async function GET(request: Request) {
  const auth = await staffClient(request); if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase.from("planting_projects")
    .select("id,project_name,description,country_name,state_province,district,locality,partner_organisation,start_date,expected_completion_date,tree_target,supported_species,land_permission_status,ecological_review_status,project_status,submitted_at,created_at,owner_id")
    .eq("project_status","submitted").order("submitted_at",{ascending:true}).limit(100);
  if (error) return NextResponse.json({error:"Could not load project queue."},{status:400});
  return NextResponse.json({projects:data??[]});
}
export async function PATCH(request: Request) {
  const auth = await staffClient(request); if ("error" in auth) return auth.error;
  try {
    const body=await request.json();
    if (typeof body.id!=="string" || !/^[0-9a-f-]{36}$/i.test(body.id) || !["approved","rejected"].includes(body.decision))
      return NextResponse.json({error:"A valid project and review decision are required."},{status:400});
    const reason=typeof body.reason==="string"?body.reason.trim().slice(0,2000):"";
    if(body.decision==="rejected" && reason.length<5)
      return NextResponse.json({error:"Please provide a rejection reason of at least five characters."},{status:400});
    const {data,error}=await auth.supabase.from("planting_projects").update({
      project_status:body.decision,
      ecological_review_status:body.decision==="approved"?"approved":"declined",
      reviewed_by:auth.userId, reviewed_at:new Date().toISOString(),
      rejection_reason:body.decision==="rejected"?reason:null
    }).eq("id",body.id).eq("project_status","submitted")
      .select("id,project_name,project_status,reviewed_at").maybeSingle();
    if(error) return NextResponse.json({error:"Project review failed: "+error.message},{status:400});
    if(!data) return NextResponse.json({error:"Project was not found in the pending queue or has already been reviewed."},{status:409});
    return NextResponse.json({success:true,project:data});
  } catch { return NextResponse.json({error:"Invalid request."},{status:400}); }
}
