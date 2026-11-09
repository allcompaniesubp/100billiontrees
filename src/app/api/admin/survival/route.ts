import { NextResponse } from "next/server";
import { createUserScopedSupabase, getBearerToken } from "@/lib/supabase/api-client";
export const runtime = "nodejs";
async function staffClient(request: Request) {
  const token=getBearerToken(request);
  if(!token) return {error:NextResponse.json({error:"Sign in required."},{status:401})};
  const supabase=createUserScopedSupabase(token);
  const {data:auth,error}=await supabase.auth.getUser(token);
  if(error||!auth.user) return {error:NextResponse.json({error:"Invalid session."},{status:401})};
  const {data:profile}=await supabase.from("profiles").select("role,approval_status").eq("id",auth.user.id).single();
  if(!profile||profile.approval_status!=="approved"||!["administrator","reviewer"].includes(profile.role))
    return {error:NextResponse.json({error:"Administrator or reviewer access required."},{status:403})};
  return {supabase,userId:auth.user.id};
}
export async function GET(request:Request){
  const auth=await staffClient(request);if("error" in auth)return auth.error;
  const {data,error}=await auth.supabase.from("tree_survival_logs")
    .select("id,tree_id,reporter_id,milestone,status,observed_on,growth_height_cm,canopy_spread_cm,damage_or_disease_notes,evidence_media_path,review_status,reviewer_approved,created_at,tree_registry(tree_code,species_name,project_id)")
    .eq("review_status","pending").order("created_at",{ascending:true}).limit(100);
  if(error)return NextResponse.json({error:"Could not load monitoring review queue."},{status:400});
  return NextResponse.json({logs:data??[]});
}
export async function PATCH(request:Request){
  const auth=await staffClient(request);if("error" in auth)return auth.error;
  try{
    const body=await request.json();
    if(typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||!["approved","rejected"].includes(body.decision))
      return NextResponse.json({error:"A valid report and review decision are required."},{status:400});
    const {data,error}=await auth.supabase.from("tree_survival_logs").update({
      review_status:body.decision,reviewer_approved:body.decision==="approved",
      reviewed_by:auth.userId,reviewed_at:new Date().toISOString()
    }).eq("id",body.id).eq("review_status","pending")
      .select("id,review_status,reviewer_approved,reviewed_at").maybeSingle();
    if(error)return NextResponse.json({error:"Monitoring review failed: "+error.message},{status:400});
    if(!data)return NextResponse.json({error:"Report not found or already reviewed."},{status:409});
    return NextResponse.json({success:true,log:data});
  }catch{return NextResponse.json({error:"Invalid request."},{status:400});}
}
