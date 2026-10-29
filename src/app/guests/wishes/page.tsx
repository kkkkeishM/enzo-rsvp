"use client";
import { useState } from "react";

type Wish = { id: string; author: string; message: string; approved: boolean; created_at: string };

export default function WishesAdminPage() {
  const [password, setPassword] = useState("");
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function remove(w: Wish) {
    if (!confirm(`Delete the wish from ${w.author}?`)) return;
    await call("DELETE", { id: w.id });
    load();
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
            <div className="toolbar"><div className="tools" style={{ marginLeft: 0 }}><button className="btn-sm alt" type="button" onClick={load}>Refresh</button></div></div>
            <div className="table-wrap">
              <table className="gtable" style={{ minWidth: 0 }}>
                <thead><tr><th>#</th><th>From</th><th>Wish</th><th>On the wall?</th><th>Sent</th><th><span className="sr">Actions</span></th></tr></thead>
                <tbody>
                  {wishes.length === 0 && <tr><td colSpan={6} className="empty">No wishes yet.</td></tr>}
                  {wishes.map((w, i) => (
                    <tr key={w.id}>
                      <td>{i + 1}</td>
                      <td className="nm">{w.author}</td>
                      <td>{w.message}</td>
                      <td><span className={`tag ${w.approved ? "yes" : "no"}`}>{w.approved ? "Showing" : "Hidden"}</span></td>
                      <td className="when">{new Date(w.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button type="button" className="del" style={{ color: "#1d4f91" }} onClick={() => toggle(w)}>{w.approved ? "Hide" : "Show"}</button>{" "}
                        <button type="button" className="del" onClick={() => remove(w)}>Delete</button>
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