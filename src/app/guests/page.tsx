"use client";
import { useState } from "react";

type Guest = { id: string; name: string; attending: "yes" | "no"; count: number; notes: string; at: string };

export default function GuestsPage() {
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.status === 401 ? "Wrong password" : "Couldn’t load the list");
      return;
    }
    setGuests((await res.json()).guests);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete the reply from ${name}?`)) return;
    await fetch("/api/guests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id }),
    });
    load();
  }

  function downloadCsv() {
    if (!guests) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [["Name", "Attending", "Guests", "Notes", "Answered"], ...guests.map((g) => [g.name, g.attending, g.count, g.notes, g.at])];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rsvps.csv";
    a.click();
  }

  const going = guests?.filter((g) => g.attending === "yes") ?? [];
  const headcount = going.reduce((sum, g) => sum + g.count, 0);
  const declined = (guests?.length ?? 0) - going.length;

  return (
    <main className="admin">
      <div className="admin-wrap">
        <h1>Guest list</h1>

        {guests === null ? (
          <div className="admin-login">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
            <button className="btn-sm" type="button" onClick={load} disabled={loading}>{loading ? "Checking..." : "Open"}</button>
            {error && <p className="err" role="alert" style={{ width: "100%" }}>{error}</p>}
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat"><b>{headcount}</b><span>people coming</span></div>
              <div className="stat"><b>{going.length}</b><span>groups going</span></div>
              <div className="stat"><b>{declined}</b><span>can’t make it</span></div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button className="btn-sm alt" type="button" onClick={load}>Refresh</button>
              <button className="btn-sm alt" type="button" onClick={downloadCsv}>Download CSV</button>
            </div>

            {guests.length === 0 && <p>No replies yet.</p>}
            {guests.map((g) => (
              <div className="guest" key={g.id}>
                <div>
                  <strong>{g.name}</strong>
                  <span className={`tag ${g.attending}`}>{g.attending === "yes" ? `Going · ${g.count}` : "Can’t make it"}</span>
                  <small>{new Date(g.at).toLocaleString()}</small>
                  {g.notes && <div className="note">“{g.notes}”</div>}
                </div>
                <button type="button" onClick={() => remove(g.id, g.name)}>Delete</button>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}