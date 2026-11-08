"use client";
import { useState } from "react";
export default function ShareActions() {
  const [message, setMessage] = useState("");
  const shareUrl = "https://200billiontrees.unspuniversity.com/community";
  const shareText = "Join the 200 Billion Trees movement — plant responsibly, protect nature and share your green journey.";
  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ title: "200 Billion Trees", text: shareText, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); setMessage("Community link copied."); }
    } catch { setMessage("Sharing was cancelled or is unavailable in this browser."); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setMessage("Community link copied."); }
    catch { setMessage("Please copy the address from your browser."); }
  }
  const encoded = encodeURIComponent(shareText + " " + shareUrl);
  return <div className="share-area"><div className="share-buttons">
    <button type="button" onClick={nativeShare}>Share</button>
    <a href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noreferrer">WhatsApp</a>
    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">Facebook</a>
    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">LinkedIn</a>
    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">X</a>
    <button type="button" className="share-copy" onClick={copyLink}>Copy link</button>
  </div>{message && <p className="share-feedback" role="status">{message}</p>}</div>;
}