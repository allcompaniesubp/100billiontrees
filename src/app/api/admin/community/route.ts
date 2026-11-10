import { NextResponse } from "next/server";
import { createUserScopedSupabase, getBearerToken } from "@/lib/supabase/api-client";

export const runtime = "nodejs";

async function staffClient(request: Request) {
  const token = getBearerToken(request);
  if (!token) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const supabase = createUserScopedSupabase(token);
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return { error: NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 }) };
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role,approval_status").eq("id", auth.user.id).maybeSingle();
  if (profileError) return { error: NextResponse.json({ error: "Could not verify your staff status." }, { status: 403 }) };
  if (!profile || profile.approval_status !== "approved" || !["administrator", "reviewer"].includes(profile.role))
    return { error: NextResponse.json({ error: "Approved administrator or reviewer access required." }, { status: 403 }) };
  return { supabase, userId: auth.user.id };
}

export async function GET(request: Request) {
  const auth = await staffClient(request);
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase.from("community_posts")
    .select("id,author_id,caption,media_path,media_type,moderation_status,created_at,reviewed_at,reviewed_by")
    .in("moderation_status", ["pending", "approved", "rejected"])
    .order("created_at", { ascending: false }).limit(150);
  if (error) return NextResponse.json({
    error: "The moderation queue could not be read. The database's staff RLS policy must be aligned with approved profile status before this screen can access pending posts.",
  }, { status: 403 });

  const authorIds = [...new Set((data ?? []).map((post) => post.author_id))];
  const { data: profiles } = authorIds.length
    ? await auth.supabase.from("profiles").select("id,display_name").in("id", authorIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const posts = await Promise.all((data ?? []).map(async (post) => {
    const { data: signed, error: signedError } = await auth.supabase.storage
      .from("community-media").createSignedUrl(post.media_path, 5 * 60);
    return {
      ...post,
      author_name: names.get(post.author_id) || "Community member",
      signed_url: signedError ? null : signed?.signedUrl ?? null,
    };
  }));
  return NextResponse.json({ posts });
}

export async function PATCH(request: Request) {
  const auth = await staffClient(request);
  if ("error" in auth) return auth.error;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id) ||
      !["approved", "rejected"].includes(body.decision)) {
      return NextResponse.json({ error: "A valid post and review decision are required." }, { status: 400 });
    }
    const { data, error } = await auth.supabase.from("community_posts").update({
      moderation_status: body.decision,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", body.id).eq("moderation_status", "pending")
      .select("id,moderation_status,reviewed_at").maybeSingle();
    if (error) return NextResponse.json({
      error: "The review could not be saved. Confirm the staff UPDATE RLS policy is deployed and permits approved staff.",
    }, { status: 403 });
    if (!data) return NextResponse.json({ error: "This post is no longer pending or has already been reviewed." }, { status: 409 });
    return NextResponse.json({ success: true, post: data });
  } catch {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }
}
