"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MAX_MESSAGE = 280;
const MAX_AUTHOR = 40;

export default function WishDialog({
  open, initialName, onClose, onSent,
}: {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSent: (pending: boolean) => void;
}) {
  const [author, setAuthor] = useState(initialName);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const lock = useRef(false);

  useEffect(() => {
    if (!open) return;
    setAuthor(initialName);
    setError("");
    const t = window.setTimeout(() => msgRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open, initialName]);

  if (!open) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (!author.trim()) { setError("Please add your name."); return; }
    if (!message.trim()) { setError("Write a little wish first."); return; }
    lock.current = true;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Oops, that didn’t go through. Please try again.");
      } else {
        setMessage("");
        onSent(data.pending === true);
      }
    } catch {
      setError("Oops, that didn’t go through. Please try again.");
    } finally {
      lock.current = false;
      setSending(false);
    }
  }

  return createPortal(
    <div
      className="modal-back"
      onClick={() => { if (!lock.current) onClose(); }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !lock.current) onClose();
        e.stopPropagation(); // keep arrow keys from changing slides behind the dialog
      }}
    >
      <form className="modal wish-form" role="dialog" aria-modal="true" aria-labelledby="wish-title" onClick={(e) => e.stopPropagation()} onSubmit={send} noValidate>
        <h3 id="wish-title">Birthday wish for Enzo 🎈</h3>

        <label htmlFor="wish-author">Your name</label>
        <input id="wish-author" type="text" maxLength={MAX_AUTHOR} autoComplete="name" value={author} onChange={(e) => setAuthor(e.target.value)} />

        <label htmlFor="wish-message">Your wish</label>
        <textarea id="wish-message" ref={msgRef} rows={4} maxLength={MAX_MESSAGE} placeholder="Happy 1st birthday, Enzo!" value={message} onChange={(e) => setMessage(e.target.value)} />
        <small className="wish-count">{message.length}/{MAX_MESSAGE}</small>

        <p className="err" role="alert">{error}</p>
        <div className="modal-actions">
          <button type="button" className="btn-sm alt" disabled={sending} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-sm" disabled={sending}>{sending ? "Sending..." : "Send my wish"}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}