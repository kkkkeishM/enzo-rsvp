"use client";
import { useMemo, useState } from "react";

type Guest = {
  id: string; name: string; attending: "yes" | "no"; count: number; notes: string; at: string;
  adults: string[]; kids: string[]; invite: string | null;
};
type View = "replies" | "people";
type Filter = "all" | "yes" | "no";

const lines = (arr: string[]) => (arr.length ? arr.map((n, i) => <div key={i}>{n}</div>) : "–");

export default function GuestsPage() {
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [capacity, setCapacity] = useState(80);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("replies");
  const [filter, setFilter] = useState<Filter>("all");

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
    const data = await res.json();
    setGuests(data.guests);
    if (data.capacity) setCapacity(data.capacity);
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

  const going = useMemo(() => guests?.filter((g) => g.attending === "yes") ?? [], [guests]);
  const headcount = going.reduce((sum, g) => sum + g.count, 0);
  const declined = (guests?.length ?? 0) - going.length;
  const shown = useMemo(() => (guests ?? []).filter((g) => filter === "all" || g.attending === filter), [guests, filter]);

  // one row per person who is coming (handy for a check-in list or name tags)
  const people = useMemo(() => {
    const rows: { who: string; role: string; group: string }[] = [];
    for (const g of going) {
      rows.push({ who: g.name, role: "Guest", group: g.name });
      g.adults.forEach((n) => rows.push({ who: n, role: "Adult", group: g.name }));
      g.kids.forEach((n) => rows.push({ who: n, role: "Kid", group: g.name }));
      const unnamed = g.count - (1 + g.adults.length + g.kids.length); // replies from before names were collected
      for (let i = 0; i < unnamed; i++) rows.push({ who: "(name not given)", role: "Guest", group: g.name });
    }
    return rows;
  }, [going]);

  function downloadCsv() {
    if (!guests) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Attending", "People", "Adult guests", "Kids", "Notes", "Invite code", "Answered"],
      ...guests.map((g) => [g.name, g.attending, g.count, g.adults.join("; "), g.kids.join("; "), g.notes, g.invite ?? "", g.at]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rsvps.csv";
    a.click();
  }

  return (
    <main className="admin">
      <div className="admin-wrap wide">
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
              <div className="stat"><b>{headcount} / {capacity}</b><span>people coming</span></div>
              <div className="stat"><b>{going.length}</b><span>replies: going</span></div>
              <div className="stat"><b>{declined}</b><span>replies: can’t make it</span></div>
            </div>

            <div className="toolbar">
              <div className="tabs" role="tablist" aria-label="View">
                <button type="button" role="tab" aria-selected={view === "replies"} className={view === "replies" ? "on" : ""} onClick={() => setView("replies")}>By reply</button>
                <button type="button" role="tab" aria-selected={view === "people"} className={view === "people" ? "on" : ""} onClick={() => setView("people")}>Every person</button>
              </div>
              {view === "replies" && (
                <div className="tabs" role="tablist" aria-label="Filter">
                  <button type="button" className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
                  <button type="button" className={filter === "yes" ? "on" : ""} onClick={() => setFilter("yes")}>Going</button>
                  <button type="button" className={filter === "no" ? "on" : ""} onClick={() => setFilter("no")}>Can’t make it</button>
                </div>
              )}
              <div className="tools">
                <button className="btn-sm alt" type="button" onClick={load}>Refresh</button>
                <button className="btn-sm alt" type="button" onClick={downloadCsv}>Download CSV</button>
              </div>
            </div>

            {view === "replies" ? (
              <div className="table-wrap">
                <table className="gtable">
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Status</th><th className="num">People</th>
                      <th>Adult guest</th><th>Kids</th><th>Notes</th><th>Answered</th><th><span className="sr">Delete</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 && <tr><td colSpan={9} className="empty">No replies here yet.</td></tr>}
                    {shown.map((g, i) => (
                      <tr key={g.id}>
                        <td>{i + 1}</td>
                        <td className="nm">{g.name}</td>
                        <td><span className={`tag ${g.attending}`}>{g.attending === "yes" ? "Going" : "Can’t make it"}</span></td>
                        <td className="num">{g.attending === "yes" ? g.count : "–"}</td>
                        <td>{g.attending === "yes" ? lines(g.adults) : "–"}</td>
                        <td>{g.attending === "yes" ? lines(g.kids) : "–"}</td>
                        <td className="notes">{g.notes || "–"}</td>
                        <td className="when">{new Date(g.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                        <td><button type="button" className="del" onClick={() => remove(g.id, g.name)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total people coming (all replies)</td>
                      <td className="num">{headcount}</td>
                      <td colSpan={5}>of {capacity} spots</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="gtable">
                  <thead><tr><th>#</th><th>Name</th><th>Who</th><th>Came with</th></tr></thead>
                  <tbody>
                    {people.length === 0 && <tr><td colSpan={4} className="empty">Nobody has said yes yet.</td></tr>}
                    {people.map((p, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="nm">{p.who}</td>
                        <td><span className={`role ${p.role.toLowerCase()}`}>{p.role}</span></td>
                        <td>{p.group}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td colSpan={2}>Total people</td><td colSpan={2}>{people.length} of {capacity} spots</td></tr></tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}