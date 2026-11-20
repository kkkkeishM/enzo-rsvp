"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type Relation = "family" | "friend" | null;
type Side = "eman" | "gwen" | null;
type Sponsor = "ninang" | "ninong" | null;
type Guest = {
  id: string; name: string; attending: "yes" | "no"; count: number; notes: string; at: string;
  adults: string[]; kids: string[]; invite: string | null; relation: Relation; adminNote: string;
  sponsor: Sponsor; side: Side; present: boolean; missing: number; missingNote: string;
};
type NewGuest = {
  name: string; attending: "yes" | "no"; count: number; relation: Relation; side: Side; sponsor: Sponsor;
  adults: string[]; kids: string[]; adminNote: string;
};
type View = "replies" | "people";
type Filter = "all" | "yes" | "no";

const lines = (arr: string[]) => (arr.length ? arr.map((n, i) => <div key={i}>{n}</div>) : "–");
const splitNames = (s: string) => s.split("\n").map((x) => x.trim().replace(/\s+/g, " ")).filter(Boolean);

// the dropdown stores relation + side together as e.g. "family:eman"
const relValue = (r: Relation, s: Side) => (r ? (s ? `${r}:${s}` : r) : "");
const parseRel = (v: string): { relation: Relation; side: Side } => {
  if (!v) return { relation: null, side: null };
  const [r, s] = v.split(":");
  return { relation: r as Relation, side: (s || null) as Side };
};

function RelOptions({ current }: { current?: string }) {
  return (
    <>
      <option value="">Not set</option>
      {current === "family" && <option value="family">Family (side not set)</option>}
      {current === "friend" && <option value="friend">Friend (side not set)</option>}
      <optgroup label="Family">
        <option value="family:eman">Family of Father</option>
        <option value="family:gwen">Family of Mother</option>
      </optgroup>
      <optgroup label="Friend">
        <option value="friend:eman">Friend of Father</option>
        <option value="friend:gwen">Friend of Mother</option>
      </optgroup>
    </>
  );
}

function NoteCell({ name, value, onSave, disabled }: { name: string; value: string; onSave: (v: string) => Promise<boolean>; disabled?: boolean }) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const ref = useRef<HTMLTextAreaElement>(null);

  // grow or shrink to fit the text
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  async function commit() {
    const v = text.trim();
    if (disabled || v === value) return;
    setState("saving");
    const ok = await onSave(v);
    setState(ok ? "saved" : "error");
    if (ok) window.setTimeout(() => setState("idle"), 1500);
  }

  return (
    <div className="notecell">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        maxLength={300}
        placeholder="Add a note..."
        aria-label={`Your note about ${name}`}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Enter saves, Shift+Enter makes a new line
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
        }}
      />
      <small className={state}>{state === "saving" ? "Saving..." : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}</small>
    </div>
  );
}

function TotalCell({ name, value, min, onSave, disabled }: { name: string; value: number; min: number; onSave: (v: number) => Promise<boolean>; disabled?: boolean }) {
  const [text, setText] = useState(String(value));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => { setText(String(value)); }, [value]); // follow Refresh

  async function commit() {
    if (disabled) return;
    const n = Number(text);
    if (!Number.isInteger(n) || n < min || n > 99) {
      setText(String(value));
      setState("error");
      return;
    }
    if (n === value) return;
    setState("saving");
    const ok = await onSave(n);
    if (!ok) setText(String(value));
    setState(ok ? "saved" : "error");
    if (ok) window.setTimeout(() => setState("idle"), 1500);
  }

  return (
    <div className="notecell totalcell">
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={99}
        value={text}
        disabled={disabled}
        aria-label={`Total people for ${name}`}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      <small className={state}>{state === "saving" ? "Saving..." : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}</small>
    </div>
  );
}

function AdultsEditor({ name, initial, onSave, onCancel }: { name: string; initial: string[]; onSave: (v: string[]) => Promise<string | null>; onCancel: () => void }) {
  const [names, setNames] = useState<string[]>(initial);
  const [focusLast, setFocusLast] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const cleaned = names.map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean);
    if (cleaned.join("\n") === initial.join("\n")) { onCancel(); return; }
    setSaving(true);
    setErr("");
    const msg = await onSave(cleaned);
    setSaving(false);
    if (msg) setErr(msg);
  }

  return (
    <div className="adulted">
      {names.length === 0 && <small>No adult guests yet.</small>}
      {names.map((n, i) => (
        <div className="arow" key={i}>
          <input
            type="text"
            value={n}
            maxLength={80}
            placeholder="Adult name"
            autoFocus={focusLast && i === names.length - 1}
            aria-label={`Adult guest ${i + 1} of ${name}`}
            onChange={(e) => setNames(names.map((v, j) => (j === i ? e.target.value : v)))}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") onCancel();
            }}
          />
          <button type="button" className="rm-btn" aria-label={`Remove adult guest ${i + 1} of ${name}`} onClick={() => setNames(names.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={() => { setNames([...names, ""]); setFocusLast(true); }}>
        + Add adult guest
      </button>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="acts">
        <button type="button" className="btn-sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        <button type="button" className="btn-sm alt" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}

function AddGuestPanel({ onAdd, onClose }: { onAdd: (g: NewGuest) => Promise<string | null>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [total, setTotal] = useState("1");
  const [rel, setRel] = useState("");
  const [sponsor, setSponsor] = useState<Sponsor>(null);
  const [adultsText, setAdultsText] = useState("");
  const [kidsText, setKidsText] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [added, setAdded] = useState("");
  const [saving, setSaving] = useState(false);

  const going = attending === "yes";
  const adults = splitNames(adultsText);
  const kids = splitNames(kidsText);
  const named = 1 + adults.length + kids.length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setAdded("");
    const n = Number(total);
    if (!name.trim()) { setErr("Enter the guest’s name."); return; }
    if (going && (!Number.isInteger(n) || n < 1 || n > 99)) { setErr("Total must be a whole number from 1 to 99."); return; }
    if (going && n < named) { setErr(`Total can’t be lower than ${named} (the guest plus the names you listed).`); return; }
    setErr("");
    setSaving(true);
    const { relation, side } = parseRel(rel);
    const msg = await onAdd({
      name: name.trim(), attending, count: going ? n : 0, relation, side, sponsor,
      adults: going ? adults : [], kids: going ? kids : [], adminNote: note.trim(),
    });
    setSaving(false);
    if (msg) { setErr(msg); return; }
    setAdded(`${name.trim()} added ✓`);
    setName(""); setTotal("1"); setRel(""); setSponsor(null);
    setAdultsText(""); setKidsText(""); setNote("");
  }

  return (
    <form className="addbox" onSubmit={submit} noValidate>
      <h2>Add a guest</h2>
      <div className="addgrid">
        <label>Name
          <input type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </label>
        <label>Status
          <select value={attending} onChange={(e) => setAttending(e.target.value as "yes" | "no")}>
            <option value="yes">Going</option>
            <option value="no">Can’t make it</option>
          </select>
        </label>
        {going && (
          <label>Total people (including them)
            <input type="number" inputMode="numeric" min={named} max={99} value={total} onChange={(e) => setTotal(e.target.value)} />
          </label>
        )}
        <label>Family / Friend
          <select value={rel} onChange={(e) => setRel(e.target.value)}>
            <RelOptions />
          </select>
        </label>
        <label>Ninang / Ninong
          <select value={sponsor ?? ""} onChange={(e) => setSponsor((e.target.value || null) as Sponsor)}>
            <option value="">None</option>
            <option value="ninang">Ninang</option>
            <option value="ninong">Ninong</option>
          </select>
        </label>
      </div>

      {going && (
        <div className="addgrid">
          <label>Adult guests (optional, one name per line)
            <textarea rows={3} value={adultsText} onChange={(e) => setAdultsText(e.target.value)} />
          </label>
          <label>Kids (optional, one name per line)
            <textarea rows={3} value={kidsText} onChange={(e) => setKidsText(e.target.value)} />
          </label>
        </div>
      )}

      <label>My side note (optional)
        <input type="text" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </label>

      {err && <p className="err" role="alert">{err}</p>}
      {added && <p className="ok" role="status">{added}</p>}
      <div className="addrow">
        <button className="btn-sm" type="submit" disabled={saving}>{saving ? "Adding..." : "Add guest"}</button>
        <button className="btn-sm alt" type="button" onClick={onClose}>Close</button>
      </div>
    </form>
  );
}

// who is not with a checked-in guest at the party
function MissingCell({ name, max, missing, note, onSave }: { name: string; max: number; missing: number; note: string; onSave: (n: number, note: string) => Promise<boolean> }) {
  const [num, setNum] = useState(String(missing));
  const [text, setText] = useState(note);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => { setNum(String(missing)); setText(note); }, [missing, note]); // follow Refresh

  async function commit() {
    const n = Number(num);
    if (!Number.isInteger(n) || n < 0 || n > max) {
      setNum(String(missing));
      setState("error");
      return;
    }
    const t = n === 0 ? "" : text.trim();
    if (n === missing && t === note) return;
    setState("saving");
    const ok = await onSave(n, t);
    if (!ok) { setNum(String(missing)); setText(note); }
    setState(ok ? "saved" : "error");
    if (ok) window.setTimeout(() => setState("idle"), 1500);
  }

  if (max < 1) return <small>Just them</small>;

  return (
    <div className="misscell">
      <label>
        <span>Not with them</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={num}
          aria-label={`How many of ${name}'s group are not here`}
          onChange={(e) => setNum(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
      </label>
      {Number(num) > 0 && (
        <input
          type="text"
          className="missnote"
          value={text}
          maxLength={300}
          placeholder="Who’s missing?"
          aria-label={`Who is missing from ${name}'s group`}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
      )}
      <small className={state}>{state === "saving" ? "Saving..." : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}</small>
    </div>
  );
}

// summary of everyone who said yes but is not at the party
function NotPresent({ guests, total }: { guests: Guest[]; total: number }) {
  const notHere = guests.filter((g) => !g.present);
  const partial = guests.filter((g) => g.present && g.missing > 0);
  return (
    <details className="notpres">
      <summary>
        Not present at the party: <b>{total} people</b> ({notHere.length} not checked in, {partial.length} with missing guests)
      </summary>
      {notHere.length === 0 && partial.length === 0 ? (
        <p>Everyone who said yes is here. 🎉</p>
      ) : (
        <div className="notgrid">
          <div>
            <h4>Not checked in yet ({notHere.length})</h4>
            <ul>
              {notHere.map((g) => (
                <li key={g.id}><b>{g.name}</b> <span>{g.count} {g.count === 1 ? "person" : "people"}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Checked in, but some are missing ({partial.length})</h4>
            <ul>
              {partial.map((g) => (
                <li key={g.id}>
                  <b>{g.name}</b> <span>{g.missing} missing</span>
                  {g.missingNote && <small>{g.missingNote}</small>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </details>
  );
}

const REQUIRED_NINANG = [
  "Seanna Valois","Janah Pitchay", "Keith Misa", "Princess Cordero", "Christel Peralta",
  "Jenny Forcadilla", "Alyssa Espejon", "Darlene Anilao", "Marjorie Garcia",
  "Jannah Resultay", "Gherami Mae Solis", "Noella Morales", "Ashly Montecillo",
  "Ronalyn Pelagio", "Princess Caryl Columna",
];
const REQUIRED_NINONG = [
  "Allen Dado", "Gino Dado", "Randy Guzman", "John Miguel Diones", "Wendel Arabaca",
  "Karl Benavidez", "Rob Hendrix Equipado", "Jhat Mariategue", "Aj Mark Lavado",
  "Yansie Gorimo", "Karl Joven Bautista", "Jerwen Ibarreta", "Darvin James Pascual",
  "Jasper Salandanan", "John Melvin Bozar", "Jorge Luis Reyes",
];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const ALIAS_KEY = "required-aliases";

function RequiredSponsors({ guests, locked }: { guests: Guest[]; locked: boolean }) {
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // load saved nicknames (this browser only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ALIAS_KEY);
      if (raw) setAliases(JSON.parse(raw));
    } catch {}
  }, []);

  // NEW: close any open editor the moment the list gets locked
  useEffect(() => {
    if (locked) setEditing(null);
  }, [locked]);

  function saveAlias(orig: string, value: string) {
    if (locked) return; // NEW
    const v = value.trim().replace(/\s+/g, " ");
    const next = { ...aliases };
    if (!v || norm(v) === norm(orig)) delete next[orig];
    else next[orig] = v;
    setAliases(next);
    try { localStorage.setItem(ALIAS_KEY, JSON.stringify(next)); } catch {}
    setEditing(null);
  }

  // match using the nickname if one was set, otherwise the original name
  const find = (name: string) => {
    const n = norm(aliases[name] ?? name);
    return (
      guests.find((g) => norm(g.name) === n) ??
      guests.find((g) => {
        const m = norm(g.name);
        return m.length >= 4 && (m.includes(n) || n.includes(m));
      })
    );
  };

  const status = (name: string) => {
    const g = find(name);
    if (!g) return { key: "none", label: "No reply yet" };
    return g.attending === "yes"
      ? { key: "yes", label: "Going" }
      : { key: "no", label: "Can’t make it" };
  };

  const group = (title: string, names: string[]) => {
    const rows = names.map((n) => ({ n, s: status(n) }));
    const going = rows.filter((r) => r.s.key === "yes").length;
    return (
      <div className="reqcol">
        <h3>{title} <small>{going} of {names.length} going</small></h3>
        <ol>
          {rows.map((r) => (
            <li key={r.n}>
              {editing === r.n ? (
                <span className="reqedit">
                  <input
                    type="text"
                    list="reply-names"
                    value={draft}
                    autoFocus
                    maxLength={80}
                    placeholder="Name used in the RSVP"
                    aria-label={`Name used in the RSVP for ${r.n}`}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveAlias(r.n, draft); }
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                  <button type="button" className="reqbtn save" onClick={() => saveAlias(r.n, draft)}>Save</button>
                  <button type="button" className="reqbtn" onClick={() => setEditing(null)}>Cancel</button>
                </span>
              ) : (
                <>
                  <span>
                    {(() => {
                      const words = r.n.split(" ");
                      const last = words.pop();
                      return (
                        <>
                          {words.length > 0 && <>{words.join(" ")} </>}
                          <span className="reqlast">
                            {last}
                            <button
                              type="button"
                              className="reqicon"
                              disabled={locked}
                              title={locked ? "Locked" : "Edit name"}
                              aria-label={`Edit the RSVP name for ${r.n}`}
                              onClick={() => { setEditing(r.n); setDraft(aliases[r.n] ?? r.n); }}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>
                          </span>
                        </>
                      );
                    })()}
                    {aliases[r.n] && <small className="reqalias"> → {aliases[r.n]}</small>}
                  </span>
                  <span className={`reqtag ${r.s.key}`}>{r.s.label}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <details className="reqbox">
      <summary>Required guests on Enzo’s christening</summary>

      {/* suggestions: pick the exact name from your replies */}
      <datalist id="reply-names">
        {guests.map((g) => <option key={g.id} value={g.name} />)}
      </datalist>

      <div className="reqgrid">
        {group("Ninang", REQUIRED_NINANG)}
        {group("Ninong", REQUIRED_NINONG)}
      </div>
      <p className="reqhint">
        “No reply yet” can also mean the guest used a nickname. Tap Edit and type the name they used in the RSVP.
      </p>
    </details>
  );
}

export default function GuestsPage() {
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [capacity, setCapacity] = useState(90);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("replies");
  const [filter, setFilter] = useState<Filter>("all");

  const [locked, setLocked] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockPw, setUnlockPw] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // which guest card is expanded on phones
  const lockedHit = useRef(false);

  const LOCKED_MSG = "The guest list is locked. Contact the admin to unlock it.";

  // returns true when the server says the list is locked
  function lockedResponse(res: Response) {
    if (res.status !== 423) return false;
    lockedHit.current = true;
    setLocked(true);
    setAddOpen(false);
    setEditingId(null);
    setNotice(LOCKED_MSG);
    return true;
  }
  function failNotice(msg: string) {
    setNotice(lockedHit.current ? LOCKED_MSG : msg);
    lockedHit.current = false;
  }

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
    setLocked(!!data.locked);
    if (data.capacity) setCapacity(data.capacity);
  }

  async function lockNow() {
    if (!confirm("Lock the guest list?\n\nEditing, adding and deleting will be turned off until the admin unlocks it. Check-in will still work.")) return;
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "lock" }),
    });
    if (res.ok) {
      setLocked(true);
      setAddOpen(false);
      setEditingId(null);
      setNotice("");
    } else {
      setNotice("Couldn’t lock the list. Did you run lock-setup.sql in Supabase?");
    }
  }

  async function unlockNow(e: FormEvent) {
    e.preventDefault();
    setUnlockError("");
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "unlock", unlockPassword: unlockPw }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setUnlockError(data.error ?? "Couldn’t unlock.");
      return;
    }
    setLocked(false);
    setUnlockOpen(false);
    setUnlockPw("");
    setNotice("");
  }

  async function addGuest(g: NewGuest): Promise<string | null> {
    if (g.attending === "yes" && headcount + g.count > capacity) {
      if (!confirm(`This brings the total to ${headcount + g.count} of ${capacity} spots. Add anyway?`)) return "Not added.";
    }
    const res = await fetch("/api/guests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, ...g }),
    });
    const data = await res.json().catch(() => ({}));
    if (lockedResponse(res)) return LOCKED_MSG;
    if (!res.ok) {
      const base = data.error ?? "Couldn’t add the guest.";
      return data.detail ? `${base} (${data.detail})` : base;
    }
    setGuests((gs) => [data.guest as Guest, ...(gs ?? [])]); // cards update from this list
    return null;
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete the reply from ${name}?`)) return;
    const res = await fetch("/api/guests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id }),
    });
    if (lockedResponse(res)) return;
    load();
  }

  async function removeAll() {
    if (!guests || guests.length === 0) return;
    const typed = prompt(
      `This permanently deletes all ${guests.length} replies and frees every spot.\nTip: download the CSV first.\n\nType DELETE to confirm.`
    );
    if (typed !== "DELETE") return;
    setLoading(true);
    setNotice("");
    const results = await Promise.all(
      guests.map((g) =>
        fetch("/api/guests", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, id: g.id }),
        }).catch(() => null)
      )
    );
    setLoading(false);
    if (results.some((r) => r && r.status === 423)) {
      setLocked(true);
      setNotice(LOCKED_MSG);
      return;
    }
    const failed = results.filter((r) => !r || !r.ok).length;
    await load();
    if (failed) setNotice(`${failed} repl${failed === 1 ? "y" : "ies"} couldn’t be deleted. Try again.`);
  }

  async function patch(id: string, body: { relation?: Relation; side?: Side; adminNote?: string; sponsor?: Sponsor; count?: number; adults?: string[]; present?: boolean; missing?: number; missingNote?: string }) {
    const res = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id, ...body }),
    });
    if (lockedResponse(res)) return false;
    return res.ok;
  }

  // value looks like "family:eman", "friend:gwen", "family" (no side) or ""
  async function setRelation(id: string, value: string) {
    const { relation, side } = parseRel(value);
    const before = guests;
    setNotice("");
    setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, relation, side } : g)) ?? null);
    if (!(await patch(id, { relation, side }))) {
      setGuests(before);
      failNotice("Couldn’t save that change. Did you add the side column in Supabase and update the API route?");
    }
  }

  async function setSponsor(id: string, value: Sponsor) {
    const before = guests;
    setNotice("");
    setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, sponsor: value } : g)) ?? null);
    if (!(await patch(id, { sponsor: value }))) {
      setGuests(before);
      failNotice("Couldn’t save that change. Did you add the sponsor column in Supabase and update the API route?");
    }
  }

  // check-in on the day of the celebration (works even when the list is locked)
  async function setPresent(id: string, value: boolean) {
    const before = guests;
    setNotice("");
    setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, present: value, ...(value ? {} : { missing: 0, missingNote: "" }) } : g)) ?? null);
    if (!(await patch(id, { present: value }))) {
      setGuests(before);
      failNotice("Couldn’t save the check-in. Did you add the present column in Supabase and update the API route?");
    }
  }

  // how many of a checked-in group are not with them, and who (works even when locked)
  async function saveMissing(id: string, n: number, note: string) {
    setNotice("");
    const ok = await patch(id, { missing: n, missingNote: note });
    if (ok) setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, missing: n, missingNote: n === 0 ? "" : note } : g)) ?? null);
    else failNotice("Couldn’t save that. Did you run add-missing.sql in Supabase and update the API route?");
    return ok;
  }

  async function saveNote(id: string, v: string) {
    const ok = await patch(id, { adminNote: v });
    if (ok) setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, adminNote: v } : g)) ?? null);
    else failNotice("Couldn’t save the note. Did you run the add-relation-notes SQL in Supabase?");
    return ok;
  }

  async function saveTotal(id: string, n: number) {
    setNotice("");
    const ok = await patch(id, { count: n });
    if (ok) setGuests((gs) => gs?.map((g) => (g.id === id ? { ...g, count: n } : g)) ?? null);
    else failNotice("Couldn’t save the total. Check that the API route accepts count.");
    return ok;
  }

  // saves the edited adult list; the total grows automatically so adding adults is never blocked
  async function saveAdultsEdit(g: Guest, names: string[]): Promise<string | null> {
    const named = 1 + names.length + g.kids.length;
    const newCount = Math.max(g.count, named);
    if (newCount > 99) return "That’s more than 99 people in one group.";
    const extra = newCount - g.count;
    if (extra > 0 && headcount + extra > capacity) {
      if (!confirm(`This raises the total to ${headcount + extra} of ${capacity} spots. Save anyway?`)) return "Not saved.";
    }
    setNotice("");
    const res = await fetch("/api/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id: g.id, adults: names, ...(extra > 0 ? { count: newCount } : {}) }),
    });
    if (lockedResponse(res)) return LOCKED_MSG;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error ?? "Couldn’t save the adult names.";
    setGuests((gs) => gs?.map((x) => (x.id === g.id ? { ...x, adults: names, count: newCount } : x)) ?? null);
    setEditingId(null);
    return null;
  }

  const going = useMemo(() => guests?.filter((g) => g.attending === "yes") ?? [], [guests]);
  const headcount = going.reduce((sum, g) => sum + g.count, 0);
  const declined = (guests?.length ?? 0) - going.length;
  const left = Math.max(capacity - headcount, 0);
  const leftClass = left === 0 ? "full" : left <= 10 ? "low" : "ok";
  const presentReplies = going.filter((g) => g.present).length;
  const here = (g: Guest) => g.count - Math.min(g.missing, g.count - 1);
  const presentPeople = going.filter((g) => g.present).reduce((sum, g) => sum + here(g), 0);
  const notPresentPeople = headcount - presentPeople;
  const shown = useMemo(() => (guests ?? []).filter((g) => filter === "all" || g.attending === filter), [guests, filter]);

  const byType = (t: Relation) => going.filter((g) => g.relation === t).reduce((sum, g) => sum + g.count, 0);
  const repliesOf = (t: Relation) => (guests ?? []).filter((g) => g.relation === t).length;
  const bySide = (r: Relation, s: Side) =>
    going.filter((g) => g.relation === r && g.side === s).reduce((sum, g) => sum + g.count, 0);
  const sponsorStats = (s: "ninang" | "ninong") => ({
    yes: (guests ?? []).filter((g) => g.sponsor === s && g.attending === "yes").length,
    no: (guests ?? []).filter((g) => g.sponsor === s && g.attending === "no").length,
  });

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
      ["Name", "Type", "Side", "Ninang/Ninong", "Attending", "People", "Adult guests", "Kids", "Guest notes", "My notes", "Invite code", "Answered", "Present"],
      ...guests.map((g) => [
        g.name, g.relation ?? "", g.side ?? "", g.sponsor ?? "", g.attending, g.count,
        g.adults.join("; "), g.kids.join("; "), g.notes, g.adminNote, g.invite ?? "", g.at,
        g.present ? "yes" : "no",
      ]),
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

            {locked && (
              <div className="lockbar" role="status">
                <span>🔒 Locked. Editing, adding and deleting are turned off (check-in still works). Contact the admin to unlock.</span>
                {!unlockOpen && (
                  <button className="btn-sm alt" type="button" onClick={() => { setUnlockOpen(true); setUnlockError(""); }}>Unlock</button>
                )}
                {unlockOpen && (
                  <form className="unlock-form" onSubmit={unlockNow}>
                    <input
                      type="password"
                      placeholder="Admin unlock password"
                      aria-label="Admin unlock password"
                      autoComplete="off"
                      value={unlockPw}
                      onChange={(e) => setUnlockPw(e.target.value)}
                    />
                    <button className="btn-sm" type="submit">Unlock</button>
                    <button className="btn-sm alt" type="button" onClick={() => { setUnlockOpen(false); setUnlockPw(""); setUnlockError(""); }}>Cancel</button>
                    {unlockError && <p className="err" role="alert">{unlockError}</p>}
                  </form>
                )}
              </div>
            )}

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
                <button className="btn-sm" type="button" onClick={() => setAddOpen((o) => !o)} disabled={locked}>+ Add guest</button>
                <button className="btn-sm alt" type="button" onClick={load}>Refresh</button>
                <button className="btn-sm alt" type="button" onClick={downloadCsv}>Download CSV</button>
                {!locked && <button className="btn-sm alt" type="button" onClick={lockNow}>🔒 Lock</button>}
                <button className="btn-sm danger" type="button" onClick={removeAll} disabled={locked || loading || guests.length === 0}>
                  Delete all
                </button>
              </div>
            </div>

            <section className="sumcard" aria-label="Check-in summary">
            <h2 className="sumtitle">Track my guests</h2>
              <div className="sumrow">
                <div className="sumbox here"><b>{presentPeople}</b><span>present</span></div>
                <div className="sumbox away"><b>{notPresentPeople}</b><span>not present</span></div>
                <div className="sumbox"><b>{presentReplies} / {going.length}</b><span>replies checked in</span></div>
              </div>
              <div
                className="sumbar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={headcount}
                aria-valuenow={presentPeople}
                aria-label="People present"
              >
                <i style={{ width: `${headcount ? Math.min(100, Math.round((presentPeople / headcount) * 100)) : 0}%` }} />
              </div>
              <NotPresent guests={going} total={notPresentPeople} />
            </section>

            {addOpen && !locked && <AddGuestPanel onAdd={addGuest} onClose={() => setAddOpen(false)} />}

            {view === "replies" ? (
              <div className="table-wrap">
                <table className="gtable greplies">
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Family / Friend</th><th>Ninang / Ninong</th><th>Status</th><th className="num">People</th>
                      <th>Adult guest</th><th>Kids</th><th>Guest’s notes</th><th>My side notes</th><th>Answered</th><th>At the party</th><th><span className="sr">Delete</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 && <tr><td colSpan={13} className="empty">No replies here yet.</td></tr>}
                    {shown.map((g, i) => (
                      <tr key={g.id} className={openId === g.id ? "gcard open" : "gcard"}>
                        <td>{i + 1}</td>
                        <td className="nm">
                          <label className="chk">
                            <input
                              type="checkbox"
                              checked={g.present}
                              onChange={(e) => setPresent(g.id, e.target.checked)}
                              aria-label={`Mark ${g.name} as present`}
                            />
                            <span>{g.name}</span>
                          </label>
                        </td>
                        <td data-label="Family / Friend">
                          <select
                                className={`rel ${g.relation ?? ""} ${g.relation && g.side ? `${g.relation}-${g.side}` : ""}`}
                            value={relValue(g.relation, g.side)}
                            disabled={locked}
                            aria-label={`Family or friend: ${g.name}`}
                            onChange={(e) => setRelation(g.id, e.target.value)}
                          >
                            <RelOptions current={relValue(g.relation, g.side)} />
                          </select>
                        </td>
                        <td data-label="Ninang / Ninong">
                          {g.sponsor ? <span className={`rel ${g.sponsor}`}>{g.sponsor === "ninang" ? "Ninang" : "Ninong"}</span> : "–"}
                        </td>
                        <td className="stcell">
                          {g.attending === "yes" && g.present && <span className="tag here">Present</span>}
                          <span className={`tag ${g.attending}`}>{g.attending === "yes" ? "Going" : "Can’t make it"}</span>
                          <button
                            type="button"
                            className="rowtoggle"
                            aria-expanded={openId === g.id}
                            aria-label={`${openId === g.id ? "Hide" : "Show"} details for ${g.name}`}
                            onClick={() => setOpenId(openId === g.id ? null : g.id)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                        </td>
                        <td className="num" data-label="People">
                          {g.attending === "yes" ? (
                            <TotalCell
                              key={g.id}
                              name={g.name}
                              value={g.count}
                              min={1 + g.adults.length + g.kids.length}
                              disabled={locked}
                              onSave={(n) => saveTotal(g.id, n)}
                            />
                          ) : "–"}
                        </td>
                        <td data-label="Adult guest">
                          {g.attending === "yes"
                            ? editingId === g.id
                              ? <AdultsEditor key={g.id} name={g.name} initial={g.adults} onSave={(v) => saveAdultsEdit(g, v)} onCancel={() => setEditingId(null)} />
                              : lines(g.adults)
                            : "–"}
                        </td>
                        <td data-label="Kids">{g.attending === "yes" ? lines(g.kids) : "–"}</td>
                        <td className="notes" data-label="Guest’s notes">{g.notes || "–"}</td>
                        <td data-label="My side notes"><NoteCell key={g.id} name={g.name} value={g.adminNote} disabled={locked} onSave={(v) => saveNote(g.id, v)} /></td>
                        <td className="when" data-label="Answered">{new Date(g.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                        <td data-label="At the party">
                          {g.attending === "yes" && g.present ? (
                            <MissingCell
                              key={g.id}
                              name={g.name}
                              max={g.count - 1}
                              missing={g.missing}
                              note={g.missingNote}
                              onSave={(n, note) => saveMissing(g.id, n, note)}
                            />
                          ) : "–"}
                        </td>
                        <td data-label="Actions">
                          <div className="rowact">
                            {g.attending === "yes" && editingId !== g.id && (
                              <button type="button" className="edit-btn" disabled={locked || editingId !== null} onClick={() => setEditingId(g.id)}>Edit</button>
                            )}
                            <button type="button" className="del" disabled={locked} onClick={() => remove(g.id, g.name)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={13}>
                      <RequiredSponsors guests={guests} locked={locked} />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5}>Total people coming (all replies)</td>
                      <td className="num">{headcount}</td>
                      <td colSpan={7}>of {capacity} spots</td>
                    </tr>
                    <tr>
                      <td colSpan={13}>
                        People coming: Family {byType("family")} · Friends {byType("friend")} · Not set {byType(null)}
                        {" "}| Replies: Family {repliesOf("family")} · Friends {repliesOf("friend")} · Not set {repliesOf(null)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13}>
                        Eman: Family {bySide("family", "eman")} · Friends {bySide("friend", "eman")}
                        {" "}| Gwen: Family {bySide("family", "gwen")} · Friends {bySide("friend", "gwen")}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={13}>
                        Ninang: {sponsorStats("ninang").yes} coming, {sponsorStats("ninang").no} can’t make it
                        {" "}· Ninong: {sponsorStats("ninong").yes} coming, {sponsorStats("ninong").no} can’t make it
                      </td>
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