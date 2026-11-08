"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  caption: string;
  media_path: string;
  media_type: "image" | "video";
  moderation_status: string;
  created_at: string;
  signedUrl?: string;
};

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);

export default function CommunityMedia() {
  const [userId, setUserId] = useState<string | null>(null);
  const [approval, setApproval] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Checking your member account…");

  async function refresh() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    setUserId(user?.id ?? null);
    if (!user) {
      setApproval(null);
      setPosts([]);
      setMessage("Sign in or create an account to share community photos and videos.");
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      setMessage("We could not read your member approval status. Please try again later.");
      return;
    }
    const status = profile?.approval_status ?? "pending";
    setApproval(status);
    const { data, error } = await supabase
      .from("community_posts")
      .select("id,caption,media_path,media_type,moderation_status,created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      setMessage("Your account is connected, but the community feed could not be loaded.");
      return;
    }
    const hydrated = await Promise.all((data ?? []).map(async (post) => {
      const { data: signed } = await supabase.storage
        .from("community-media")
        .createSignedUrl(post.media_path, 60 * 10);
      return { ...post, signedUrl: signed?.signedUrl };
    }));
    setPosts(hydrated);
    setMessage(status === "approved"
      ? "Your member account is approved. You can share photos and videos."
      : "Your account is active, but uploads are available after a community administrator approves your membership.");
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await refresh();
      } catch {
        if (active) setMessage("Supabase is not configured in this deployment yet.");
      }
    })();
    const supabase = getSupabaseBrowserClient();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || approval !== "approved" || !file || !consent) return;
    if (!ACCEPTED.has(file.type)) {
      setMessage("Choose a JPG, PNG, WebP, MP4 or WebM file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("The maximum file size is 50 MB.");
      return;
    }
    setBusy(true);
    setMessage("Uploading privately for moderation…");
    const supabase = getSupabaseBrowserClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const mediaType = file.type.startsWith("image/") ? "image" : "video";
    try {
      const { error: uploadError } = await supabase.storage
        .from("community-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("community_posts").insert({
        author_id: userId,
        caption: caption.trim(),
        media_path: path,
        media_type: mediaType,
        moderation_status: "pending",
        consent_confirmed: true,
      });
      if (insertError) {
        await supabase.storage.from("community-media").remove([path]);
        throw insertError;
      }
      setCaption("");
      setFile(null);
      setConsent(false);
      const input = document.getElementById("community-media-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Upload received. Your media is private and will appear publicly only after human moderation.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    setMessage(error ? error.message : "You have signed out.");
    await refresh();
  }

  return <section className="community-media">
    <div className="community-media-heading">
      <div><p className="kicker">Member media space</p><h2>Community photos and videos</h2></div>
      {userId && <button type="button" className="community-signout" onClick={signOut}>Sign out</button>}
    </div>
    <p className="community-media-status" role="status" aria-live="polite">{message}</p>
    {!userId ? <p><a className="community-contact" href="/sign-in">Sign in</a>　<a href="/register">Create an account</a></p> : <>
      {approval === "approved" ? <form className="community-media-form" onSubmit={upload}>
        <label>Photo or video<input id="community-media-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={chooseFile} required /></label>
        <small>JPG, PNG, WebP, MP4 or WebM · maximum 50 MB</small>
        <label>Caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={2000} rows={3} placeholder="Tell the community about your planting or tree-care activity." /></label>
        <label className="community-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /> I own this media or have permission to share it, have obtained consent from identifiable people, and understand it will remain private until reviewed.</label>
        <button type="submit" disabled={busy || !file || !consent}>{busy ? "Uploading…" : "Upload for review"}</button>
      </form> : <div className="community-pending"><strong>Membership approval pending</strong><p>To prevent spam and protect the community, uploads are enabled only for approved members. Your account is not blocked from browsing public pages.</p></div>}
      <div className="community-post-grid">
        {posts.map((post) => <article className="community-post" key={post.id}>
          {post.signedUrl ? post.media_type === "image"
            ? <img src={post.signedUrl} alt={post.caption || "Community tree planting update"} />
            : <video src={post.signedUrl} controls preload="metadata" />
            : <div className="community-post-private">Media awaiting approval</div>}
          <div><p>{post.caption || "Community update"}</p><small>{post.moderation_status === "approved" ? "Approved" : "Your post · " + post.moderation_status}</small></div>
        </article>)}
      </div>
    </>}
  </section>;
}
