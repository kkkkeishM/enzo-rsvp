"use client";
import { useEffect, useRef, useState } from "react";

type Wish = { id: string; author: string; message: string; approved: boolean; created_at: string };

const MAX_AUTHOR = 60; // keep this the same as MAX_AUTHOR in the API route

// The name is read-only until you press Edit. The field grows to fit the whole name.
function NameCell({ value, onSave }: { value: string; onSave: (v: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setText(value); }, [value, editing]); // follow Refresh

  // grow or shrink to fit the text
  useEffect(() => {
    const el = ref.current;
    if (!editing || !el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, editing]);

  // jump into the field with the cursor at the end
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const n = ref.current.value.length;
      ref.current.setSelectionRange(n, n);
    }
  }, [editing]);

  function cancel() {
    setText(value);
    setErr("");
    setEditing(false);
  }

  async function save() {
    if (saving) return;
    const v = text.replace(/\s+/g, " ").trim();
    if (!v) { setErr("Name can’t be empty."); return; }
    if (v === value) { cancel(); return; }
    setSaving(true);
    setErr("");
    const ok = await onSave(v);
    setSaving(false);
    if (ok) setEditing(false);
    else setErr("Couldn’t save. Try again.");
  }

  if (!editing) {
    return (
      <div className="wnameview">
        <span>{value}</span>
        <button type="button" className="wedit" title="Edit name" aria-label={`Edit the name ${value}`} onClick={() => setEditing(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="wnameedit notecell">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        maxLength={MAX_AUTHOR}
        aria-label={`New name for ${value}`}
        disabled={saving}
        onChange={(e) => setText(e.target.value.replace(/\n/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); save(); }
          if (e.key === "Escape") cancel();
        }}
      />
      {err && <small className="error">{err}</small>}
      <div className="acts">
        <button type="button" className="btn-sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button type="button" className="btn-sm alt" onClick={cancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}

export default function WishesAdminPage() {
  const [password, setPassword] = useState("");
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null); // which wish card is expanded on phones

  async function call(method: string, body: Record<string, unknown>) {
    return fetch("/api/wishes/admin", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, ...body }) });
  }

  async function load() {
    setLoading(true);
    setError("");
    const res = await call("POST", {});
    setLoading(false);
    if (!res.ok) { setError(res.status === 401 ? "Wrong password" : "Couldn’t load the wishes"); return; }
    setWishes((await res.json()).wishes);
  }

  async function toggle(w: Wish) {
    await call("PATCH", { id: w.id, approved: !w.approved });
    load();
  }

  async function saveAuthor(w: Wish, author: string) {
    setError("");
    const res = await call("PATCH", { id: w.id, author }).catch(() => null);
    if (!res || !res.ok) return false;
    setWishes((ws) => ws?.map((x) => (x.id === w.id ? { ...x, author } : x)) ?? null);
    return true;
  }

  async function remove(w: Wish) {
    if (!confirm(`Delete the wish from ${w.author}?`)) return;
    await call("DELETE", { id: w.id });
    load();
  }

  async function removeAll() {
    if (!wishes || wishes.length === 0) return;
    const typed = prompt(`This permanently deletes all ${wishes.length} wishes from the wall.\n\nType DELETE to confirm.`);
    if (typed !== "DELETE") return;
    setLoading(true);
    setError("");
    const results = await Promise.all(wishes.map((w) => call("DELETE", { id: w.id }).catch(() => null)));
    const failed = results.filter((r) => !r || !r.ok).length;
    await load(); // load() clears the error, so set the message after it finishes
    if (failed) setError(`${failed} wish${failed === 1 ? "" : "es"} couldn’t be deleted. Try again.`);
  }

  const shown = wishes?.filter((w) => w.approved).length ?? 0;

  return (
    <main className="admin">
      <div className="admin-wrap wide">
        <h1>Birthday wishes</h1>

        {wishes === null ? (
          <div className="admin-login">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
            <button className="btn-sm" type="button" onClick={load} disabled={loading}>{loading ? "Checking..." : "Open"}</button>
            {error && <p className="err" role="alert" style={{ width: "100%" }}>{error}</p>}
          </div>
        ) : (
          <>
            <p style={{ fontWeight: 800 }}>{wishes.length} wishes · {shown} showing on the wall · {wishes.length - shown} hidden</p>
            {error && <p className="err" role="alert">{error}</p>}
            <div className="toolbar">
              <div className="tools" style={{ marginLeft: 0 }}>
                <button className="btn-sm alt" type="button" onClick={load}>Refresh</button>
                <button className="btn-sm danger" type="button" onClick={removeAll} disabled={loading || wishes.length === 0}>
                  Delete all
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="gtable wtable" style={{ minWidth: 0 }}>
                <thead><tr><th>#</th><th>From</th><th>Wish</th><th>On the wall?</th><th>Sent</th><th><span className="sr">Actions</span></th></tr></thead>
                <tbody>
                  {wishes.length === 0 && <tr><td colSpan={6} className="empty">No wishes yet.</td></tr>}
                  {wishes.map((w, i) => (
                    <tr key={w.id} className={openId === w.id ? "wcard open" : "wcard"}>
                      <td>{i + 1}</td>
                      <td className="nm">
                        <NameCell key={w.id} value={w.author} onSave={(v) => saveAuthor(w, v)} />
                      </td>
                      <td data-label="Wish"><div className="wmsg">{w.message}</div></td>
                      <td className="wstatus">
                        <span className={`tag ${w.approved ? "yes" : "no"}`}>{w.approved ? "Showing" : "Hidden"}</span>
                        <button
                          type="button"
                          className="rowtoggle"
                          aria-expanded={openId === w.id}
                          aria-label={`${openId === w.id ? "Hide" : "Show"} details for ${w.author}`}
                          onClick={() => setOpenId(openId === w.id ? null : w.id)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                        </button>
                      </td>
                      <td className="when" data-label="Sent">
                        <div>{new Date(w.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                      </td>
                      <td data-label="Actions">
                        <div className="wactions">
                          <button type="button" className="del" style={{ color: "#1d4f91" }} onClick={() => toggle(w)}>{w.approved ? "Hide" : "Show"}</button>
                          <button type="button" className="del" onClick={() => remove(w)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}