"use client";
import { useMemo, useState } from "react";

type Relation = "family" | "friend" | null;
type Guest = {
  id: string; name: string; attending: "yes" | "no"; count: number; notes: string; at: string;
  adults: string[]; kids: string[]; invite: string | null; relation: Relation; adminNote: string;
};
type View = "replies" | "people";
type Filter = "all" | "yes" | "no";

const lines = (arr: string[]) => (arr.length ? arr.map((n, i) => <div key={i}>{n}</div>) : "–");

function NoteCell({ name, value, onSave }: { name: string; value: string; onSave: (v: string) => Promise<boolean> }) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function commit() {
    const v = text.trim();
    if (v === value) return;
    setState("saving");
    const ok = await onSave(v);
    setState(ok ? "saved" : "error");
    if (ok) window.setTimeout(() => setState("idle"), 1500);
  }

  return (
    <div className="notecell">
      <input
        type="text"
        value={text}
        maxLength={300}
        placeholder="Add a note..."
        aria-label={`Your note about ${name}`}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      <small className={state}>{state === "saving" ? "Saving..." : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}</small>
    </div>
  );
}

export default function GuestsPage() {
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [capacity, setCapacity] = useState(80);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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

  async function patch(id: string, body: { relation?: Relation; adminNote?: string }) {
    const res = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id, ...body }),
    });
    return res.ok;
  }

  async function setRelation(id: string, value: Relation) {
    const before = guests;
    setNotice("");
    setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, relation: value } : g)) ?? null);
    if (!(await patch(id, { relation: value }))) {
      setGuests(before);
      setNotice("Couldn’t save that change. Did you run the add-relation-notes SQL in Supabase?");
    }
  }

  async function saveNote(id: string, v: string) {
    const ok = await patch(id, { adminNote: v });
    if (ok) setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, adminNote: v } : g)) ?? null);
    else setNotice("Couldn’t save the note. Did you run the add-relation-notes SQL in Supabase?");
    return ok;
  }

  const going = useMemo(() => guests?.filter((g) => g.attending === "yes") ?? [], [guests]);
  const headcount = going.reduce((sum, g) => sum + g.count, 0);
  const declined = (guests?.length ?? 0) - going.length;
  const left = Math.max(capacity - headcount, 0);
  const leftClass = left === 0 ? "full" : left <= 10 ? "low" : "ok";
  const shown = useMemo(() => (guests ?? []).filter((g) => filter === "all" || g.attending === filter), [guests, filter]);
  const byType = (t: Relation) => going.filter((g) => g.relation === t).reduce((sum, g) => sum + g.count, 0);

  const people = useMemo(() => {
    const rows: { who: string; role: string; group: string }[] = [];
    for (const g of going) {
      rows.push({ who: g.name, role: "Guest", group: g.name });
      g.adults.forEach((n) => rows.push({ who: n, role: "Adult", group: g.name }));
      g.kids.forEach((n) => rows.push({ who: n, role: "Kid", group: g.name }));
      const unnamed = g.count - (1 + g.adults.length + g.kids.length);
      for (let i = 0; i < unnamed; i++) rows.push({ who: "(name not given)", role: "Guest", group: g.name });
    }
    return rows;
  }, [going]);

  function downloadCsv() {
    if (!guests) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Type", "Attending", "People", "Adult guests", "Kids", "Guest notes", "My notes", "Invite code", "Answered"],
      ...guests.map((g) => [g.name, g.relation ?? "", g.attending, g.count, g.adults.join("; "), g.kids.join("; "), g.notes, g.adminNote, g.invite ?? "", g.at]),
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
              <div className={`stat left ${leftClass}`}><b>{left}</b><span>spots left</span></div>
              <div className="stat"><b>{going.length}</b><span>replies: going</span></div>
              <div className="stat"><b>{declined}</b><span>replies: can’t make it</span></div>
            </div>

            {notice && <p className="err" role="alert">{notice}</p>}

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
                      <th>#</th><th>Name</th><th>Family / Friend</th><th>Status</th><th className="num">People</th>
                      <th>Adult guest</th><th>Kids</th><th>Guest’s notes</th><th>My side notes</th><th>Answered</th><th><span className="sr">Delete</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 && <tr><td colSpan={11} className="empty">No replies here yet.</td></tr>}
                    {shown.map((g, i) => (
                      <tr key={g.id}>
                        <td>{i + 1}</td>
                        <td className="nm">{g.name}</td>
                        <td>
                          <select className={`rel ${g.relation ?? ""}`} value={g.relation ?? ""} aria-label={`Family or friend: ${g.name}`} onChange={(e) => setRelation(g.id, (e.target.value || null) as Relation)}>
                            <option value="">Not set</option>
                            <option value="family">Family</option>
                            <option value="friend">Friend</option>
                          </select>
                        </td>
                        <td><span className={`tag ${g.attending}`}>{g.attending === "yes" ? "Going" : "Can’t make it"}</span></td>
                        <td className="num">{g.attending === "yes" ? g.count : "–"}</td>
                        <td>{g.attending === "yes" ? lines(g.adults) : "–"}</td>
                        <td>{g.attending === "yes" ? lines(g.kids) : "–"}</td>
                        <td className="notes">{g.notes || "–"}</td>
                        <td><NoteCell key={g.id} name={g.name} value={g.adminNote} onSave={(v) => saveNote(g.id, v)} /></td>
                        <td className="when">{new Date(g.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                        <td><button type="button" className="del" onClick={() => remove(g.id, g.name)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Total people coming (all replies)</td>
                      <td className="num">{headcount}</td>
                      <td colSpan={6}>of {capacity} spots</td>
                    </tr>
                    <tr>
                      <td colSpan={11}>People coming by type: Family {byType("family")} · Friends {byType("friend")} · Not set {byType(null)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="gtable" style={{ minWidth: 0 }}>
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