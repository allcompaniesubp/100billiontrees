"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  subject: string;
  status: string;
  created_by: string;
  created_at: string;
};
type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function Messaging() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [reply, setReply] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("Checking your member account…");

  async function loadThreads() {
    const supabase = getSupabaseBrowserClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!auth.user) {
      setUserId(null);
      setThreads([]);
      setStatus("Sign in to send and receive private messages.");
      return;
    }
    setUserId(auth.user.id);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role,approval_status").eq("id", auth.user.id).maybeSingle();
    if (profileError) throw profileError;
    const staff = profile?.approval_status === "approved" && (profile.role === "administrator" || profile.role === "reviewer");
    setIsStaff(staff);
    const { data, error } = await supabase.from("support_conversations")
      .select("id,subject,status,created_by,created_at")
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    const list = (data ?? []) as Conversation[];
    setThreads(list);
    setActiveId((current) => current && list.some((item) => item.id === current) ? current : list[0]?.id ?? "");
    setStatus(staff ? "Foundation staff inbox · private member conversations." : "Your private messages with the Foundation team.");
  }

  async function loadMessages(conversationId: string) {
    const { data, error } = await getSupabaseBrowserClient().from("support_messages")
      .select("id,conversation_id,sender_id,body,created_at")
      .eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(200);
    if (error) {
      setStatus("Messages could not be loaded: " + error.message);
      return;
    }
    setMessages((data ?? []) as Message[]);
  }

  useEffect(() => {
    void loadThreads().catch((error) => setStatus(error instanceof Error ? error.message : "Could not load your inbox."));
  }, []);

  useEffect(() => {
    if (!userId || !activeId) {
      setMessages([]);
      return;
    }
    let active = true;
    const supabase = getSupabaseBrowserClient();
    const load = async () => {
      const { data, error } = await supabase.from("support_messages")
        .select("id,conversation_id,sender_id,body,created_at")
        .eq("conversation_id", activeId).order("created_at", { ascending: true }).limit(200);
      if (active && !error) setMessages((data ?? []) as Message[]);
      if (active && error) setStatus("Messages could not be loaded: " + error.message);
    };
    void load();
    const channel = supabase.channel("support-messages-" + activeId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: "conversation_id=eq." + activeId }, () => { void load(); })
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId, activeId]);

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !subject.trim() || !newBody.trim()) return;
    setCreating(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: thread, error: threadError } = await supabase.from("support_conversations")
        .insert({ created_by: userId, subject: subject.trim() }).select("id,subject,status,created_by,created_at").single();
      if (threadError) throw threadError;
      const { error: messageError } = await supabase.from("support_messages").insert({
        conversation_id: thread.id, sender_id: userId, body: newBody.trim(),
      });
      if (messageError) throw messageError;
      setSubject("");
      setNewBody("");
      await loadThreads();
      setActiveId(thread.id);
      setStatus("Your message has been sent privately to the Foundation team.");
    } catch (error) {
      setStatus(error instanceof Error ? "Message could not be sent: " + error.message : "Message could not be sent.");
    } finally {
      setCreating(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !activeId || !reply.trim()) return;
    setSending(true);
    try {
      const { error } = await getSupabaseBrowserClient().from("support_messages").insert({
        conversation_id: activeId, sender_id: userId, body: reply.trim(),
      });
      if (error) throw error;
      setReply("");
      await loadMessages(activeId);
      setStatus("Message sent.");
    } catch (error) {
      setStatus(error instanceof Error ? "Message could not be sent: " + error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  if (!userId) return <section className="messaging-shell"><p className="community-media-status" role="status">{status}</p><Link className="community-contact" href="/sign-in">Sign in to messages</Link></section>;

  const activeThread = threads.find((thread) => thread.id === activeId);

  return <section className="messaging-shell">
    <p className="community-media-status" role="status" aria-live="polite">{status}</p>
    <div className="messaging-layout">
      <aside className="messaging-sidebar">
        <div className="messaging-sidebar-heading"><strong>{isStaff ? "Member inbox" : "Your conversations"}</strong><span>{threads.length}</span></div>
        {threads.length === 0 ? <p className="messaging-empty">No conversations yet.</p> : threads.map((thread) =>
          <button type="button" key={thread.id} className={"messaging-thread" + (thread.id === activeId ? " active" : "")} onClick={() => setActiveId(thread.id)}>
            <strong>{thread.subject}</strong><small>{new Date(thread.created_at).toLocaleDateString()}</small>
          </button>
        )}
      </aside>
      <div className="messaging-main">
        {activeThread ? <>
          <div className="messaging-title"><div><span className="kicker">Private conversation</span><h2>{activeThread.subject}</h2></div><span className="messaging-open">{activeThread.status}</span></div>
          <div className="messaging-history" aria-live="polite">
            {messages.map((message) => <article key={message.id} className={"messaging-bubble" + (message.sender_id === userId ? " mine" : "")}>
              <p>{message.body}</p><small>{message.sender_id === userId ? "You" : "Foundation team"} · {new Date(message.created_at).toLocaleString()}</small>
            </article>)}
          </div>
          <form className="messaging-reply" onSubmit={sendReply}>
            <label htmlFor="message-reply">Your reply</label>
            <textarea id="message-reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} rows={3} placeholder="Write a private message…" required />
            <button type="submit" disabled={sending || !reply.trim()}>{sending ? "Sending…" : "Send message"}</button>
          </form>
        </> : <div className="messaging-no-selection"><span>✉️</span><h2>Start a conversation</h2><p>Send a private message to the Foundation team using the form.</p></div>}
      </div>
    </div>
    {!isStaff && <form className="messaging-new" onSubmit={startConversation}>
      <div><span className="kicker">New conversation</span><h2>Message the Foundation</h2></div>
      <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} placeholder="e.g. Help with my community upload" required /></label>
      <label>Message<textarea value={newBody} onChange={(event) => setNewBody(event.target.value)} maxLength={5000} rows={4} placeholder="How can our team help?" required /></label>
      <button type="submit" disabled={creating || !subject.trim() || !newBody.trim()}>{creating ? "Sending…" : "Send to Foundation"}</button>
    </form>}
    {isStaff && <p className="messaging-staff-note">Staff access is controlled by the member role stored in the database. Only authorised administrator and reviewer accounts can view the shared inbox.</p>}
  </section>;
}
