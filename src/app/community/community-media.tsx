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
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
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
      setMessage("We could not read your member status. Please refresh and try again.");
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

    if (status === "approved") {
      setMessage("Your member account is approved. You can upload photos and videos for review.");
    } else if (status === "pending") {
      setMessage("Your membership is pending. You can view your own submissions, but uploads become available after membership approval.");
    } else {
      setMessage("Your account is not currently eligible to upload. Please contact the Foundation if you think this is an error.");
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await refresh();
      } catch {
        if (active) setMessage("The community service could not connect. Please refresh and try again.");
      }
    })();
    const supabase = getSupabaseBrowserClient();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (active) queueMicrotask(() => { void refresh().catch(() => setMessage("Could not refresh your member session.")); });
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
    if (!userId || !["approved", "pending"].includes(approval ?? "") || !file || !consent) return;
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
      setMessage("Upload received. It is private and will appear publicly only after a moderator approves it.");
      await refresh();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown upload error";
      setMessage(`Upload could not complete: ${detail}. Please check your connection and try again.`);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    setMessage(error ? error.message : "You have signed out.");
    await refresh();
  }

  const canUpload = approval === "approved";

  return <section className="community-media">
    <div className="community-media-heading">
      <div><p className="kicker">Member media space</p><h2>Community photos and videos</h2></div>
      {userId && <button type="button" className="community-signout" onClick={signOut}>Sign out</button>}
    </div>
    <p className="community-media-status" role="status" aria-live="polite">{message}</p>
    {!userId ? <p><a className="community-contact" href="/sign-in">Sign in</a>　<a href="/register">Create an account</a></p> : <>
      {canUpload ? <form className="community-media-form" onSubmit={upload}>
        <label>Choose photos or videos<input id="community-media-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={chooseFile} required /></label>
        <small>JPG, PNG, WebP, MP4 or WebM · maximum 50 MB per file</small>
        {file && <p className="community-selected-file">Selected: <strong>{file.name}</strong> · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
        <label>Caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={2000} rows={3} placeholder="Tell the community about your planting or tree-care activity." /></label>
        <label className="community-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /> I own this media or have permission to share it, have obtained consent from identifiable people, and understand it will remain private until reviewed.</label>
        <button type="submit" disabled={busy || !file || !consent}>{busy ? "Uploading…" : "Upload photo or video for review"}</button>
      </form> : <div className="community-pending"><strong>{approval === "pending" ? "Membership approval pending" : "Uploads temporarily unavailable"}</strong><p>{approval === "pending" ? "You can view your own submissions here. Once your membership is approved, you can upload photos and videos for moderator review." : "Please contact the Foundation if you need help with your member account."}</p><a href="/messages">Message the Foundation</a></div>}
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
