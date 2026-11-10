"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  author_id: string;
  author_name: string;
  caption: string;
  media_path: string;
  media_type: "image" | "video";
  moderation_status: "pending" | "approved" | "rejected" | "removed";
  created_at: string;
  reviewed_at: string | null;
  signed_url: string | null;
};

type Filter = "pending" | "approved" | "rejected";

export default function CommunityModeration() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("Checking your approved staff access…");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const token = sessionData.session?.access_token;
    if (!token) {
      setPosts([]);
      setMessage("Sign in with an approved administrator or reviewer account.");
      setLoading(false);
      return;
    }
    const response = await fetch("/api/admin/community", {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load the moderation queue.");
    setPosts((result.posts ?? []) as Post[]);
    setMessage("Moderation queue loaded. Review media and captions before making a decision.");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Could not load moderation queue.");
      setLoading(false);
    });
  }, [load]);

  async function review(post: Post, decision: "approved" | "rejected") {
    const confirmation = decision === "approved"
      ? "Approve this post for public display?"
      : "Reject this post? It will remain private.";
    if (!window.confirm(confirmation)) return;
    setBusyId(post.id);
    try {
      const { data: sessionData } = await getSupabaseBrowserClient().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your session expired. Please sign in again.");
      const response = await fetch("/api/admin/community", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, decision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Review action failed.");
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, moderation_status: decision, reviewed_at: result.post.reviewed_at }
        : item));
      setMessage(decision === "approved"
        ? "Post approved. It can now appear in the public community feed."
        : "Post rejected. It remains private and is no longer in the pending queue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review action failed.");
    } finally {
      setBusyId("");
    }
  }

  const visible = posts.filter((post) => post.moderation_status === filter);
  const counts = {
    pending: posts.filter((post) => post.moderation_status === "pending").length,
    approved: posts.filter((post) => post.moderation_status === "approved").length,
    rejected: posts.filter((post) => post.moderation_status === "rejected").length,
  };

  return <section className="admin-shell community-review-shell">
    <p className="admin-status" role="status" aria-live="polite">{message}</p>
    <div className="admin-grid">
      <article className="admin-stat"><span>Awaiting review</span><strong>{counts.pending}</strong></article>
      <article className="admin-stat"><span>Approved</span><strong>{counts.approved}</strong></article>
      <article className="admin-stat"><span>Rejected</span><strong>{counts.rejected}</strong></article>
      <article className="admin-stat"><span>Total loaded</span><strong>{posts.length}</strong></article>
    </div>
    <div className="community-review-toolbar">
      <div className="community-review-filters" aria-label="Filter moderation posts">
        {(["pending", "approved", "rejected"] as Filter[]).map((value) =>
          <button type="button" key={value} aria-pressed={filter === value}
            className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
            {value === "pending" ? "Pending" : value === "approved" ? "Approved" : "Rejected"} ({counts[value]})
          </button>
        )}
      </div>
      <button type="button" className="community-review-refresh" onClick={() => {
        setLoading(true);
        void load().catch((error) => { setMessage(error instanceof Error ? error.message : "Refresh failed."); setLoading(false); });
      }} disabled={loading}>Refresh queue</button>
    </div>
    {loading ? <p className="community-review-empty">Loading moderation queue…</p> :
      visible.length === 0 ? <div className="community-review-empty"><h2>No {filter} posts</h2><p>There are no community uploads in this filter right now.</p></div> :
      <div className="community-review-grid">
        {visible.map((post) => <article className="community-review-card" key={post.id}>
          {post.signed_url ? post.media_type === "image"
            ? <img src={post.signed_url} alt={post.caption || "Community upload submitted for moderation"} />
            : <video src={post.signed_url} controls preload="metadata" />
            : <div className="community-review-no-media">Private media preview unavailable. Check the moderator storage read policy.</div>}
          <div className="community-review-card-body">
            <div className="community-review-meta"><span>{post.author_name}</span><time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time></div>
            <p>{post.caption || "No caption supplied."}</p>
            <span className={"community-review-state " + post.moderation_status}>{post.moderation_status}</span>
            {post.moderation_status === "pending" && <div className="community-review-actions">
              <button type="button" disabled={!!busyId} onClick={() => void review(post, "approved")}>{busyId === post.id ? "Saving…" : "Approve post"}</button>
              <button type="button" className="reject" disabled={!!busyId} onClick={() => void review(post, "rejected")}>Reject</button>
            </div>}
            {post.reviewed_at && <small className="community-review-reviewed">Reviewed {new Date(post.reviewed_at).toLocaleString()}</small>}
          </div>
        </article>)}
      </div>}
    <p className="admin-disclaimer">Approval makes the post eligible for public display. Rejection keeps the media private; files are not deleted automatically, preserving an audit trail and allowing a later authorised retention decision.</p>
    <p><Link href="/admin">← Back to administration</Link></p>
  </section>;
}
