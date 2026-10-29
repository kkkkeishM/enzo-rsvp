"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_LIMITS, MAX_ATTENDANCE, MAX_NAME_LENGTH, type InviteInfo } from "@/lib/limits";

type Piece = { left: number; color: string; dur: number; delay: number };
type Answer = "yes" | "no";
const COLORS = ["#e63b2e", "#ffc928", "#1d4f91", "#ffffff", "#15161c"];

function Confetti() {
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      dur: 2 + Math.random() * 2.5,
      delay: Math.random() * 0.6,
    }))
  );
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 5500);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  // rendered on <body>: the slides are transformed, which would misplace a fixed element
  return createPortal(
    <>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{ left: `${p.left}vw`, background: p.color, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` } as CSSProperties}
        />
      ))}
    </>,
    document.body
  );
}

function YesNo({ name, value, onChange, disableYes }: { name: string; value: Answer; onChange: (v: Answer) => void; disableYes?: boolean }) {
  return (
    <div className="choices" role="radiogroup">
      <label>
        <input type="radio" name={name} checked={value === "yes"} disabled={disableYes && value !== "yes"} onChange={() => onChange("yes")} /> Yes
      </label>
      <label>
        <input type="radio" name={name} checked={value === "no"} onChange={() => onChange("no")} /> No
      </label>
    </div>
  );
}

function NameList({
  label, names, setNames, max, canAdd, addLabel,
}: {
  label: string;
  names: string[];
  setNames: (n: string[]) => void;
  max: number;
  canAdd: boolean;
  addLabel: string;
}) {
  return (
    <div className="namelist">
      {names.map((n, i) => (
        <div className="name-row" key={i}>
          <input
            type="text"
            aria-label={`${label} ${i + 1} full name`}
            placeholder="Full name"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            value={n}
            onChange={(e) => setNames(names.map((v, j) => (j === i ? e.target.value : v)))}
          />
          {names.length > 1 && (
            <button type="button" className="rm-btn" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => setNames(names.filter((_, j) => j !== i))}>
              Remove
            </button>
          )}
        </div>
      ))}
      {max > 1 && (
        <button type="button" className="add-btn" disabled={!canAdd || names.length >= max} onClick={() => setNames([...names, ""])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}

export default function RsvpForm({
  heading, onWrite, wished, onOpenWall,
  }: {
    heading?: string;
    onWrite?: (name: string) => void;
    wished?: boolean;
    onOpenWall?: () => void;
  }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<Answer>("yes");
  const [bringAdult, setBringAdult] = useState<Answer>("no");
  const [adults, setAdults] = useState<string[]>([""]);
  const [bringKids, setBringKids] = useState<Answer>("no");
  const [kids, setKids] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [confirming, setConfirming] = useState(false);
  const [finalParty, setFinalParty] = useState(1);

  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<InviteInfo>({ label: null, type: "friend", ...DEFAULT_LIMITS, full: false });
  const [blocked, setBlocked] = useState("");

  const lock = useRef(false); // stops double-taps before React re-renders
  const confirmRef = useRef<HTMLButtonElement>(null);

  // load this guest's allowance from their personal link (?code=...)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("code")?.trim() || null;
    setCode(c);
    const ctrl = new AbortController();
    fetch(`/api/invite${c ? `?code=${encodeURIComponent(c)}` : ""}`, { signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok) setInfo(d as InviteInfo);
        else setBlocked(d.error ?? "This invitation link was not recognized.");
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const going = attending === "yes";
  const adultCount = going && bringAdult === "yes" ? adults.length : 0;
  const kidCount = going && bringKids === "yes" ? kids.length : 0;
  const party = going ? 1 + adultCount + kidCount : 0;
  const room = info.maxGuests - party;

  const adultsOk = info.maxAdults >= 1 && info.maxGuests - (1 + kidCount) >= 1;
  const kidsOk = info.maxKids >= 1 && info.maxGuests - (1 + adultCount) >= 1;

  function chooseAttending(v: Answer) {
    setAttending(v);
    if (v === "no") {
      setBringAdult("no"); setAdults([""]);
      setBringKids("no"); setKids([""]);
    }
  }
  function chooseAdult(v: Answer) {
    setBringAdult(v);
    setAdults([""]); // switching on starts with one empty field, switching off clears them
  }
  function chooseKids(v: Answer) {
    setBringKids(v);
    setKids([""]);
  }

  function validate(): string {
    if (blocked) return blocked;
    if (!name.trim()) return "Enter your name so we know who is on the grid.";
    if (!going) return "";
    if (bringAdult === "yes" && adults.some((n) => !n.trim())) return "Enter the full name of your adult guest.";
    if (bringKids === "yes" && kids.some((n) => !n.trim())) return "Enter the full name of every child, or remove the empty fields.";
    if (party > info.maxGuests) return `Your invitation includes up to ${info.maxGuests} guests, including you.`;
    return "";
  }

  function review(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle" || lock.current) return;
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError("");
    setConfirming(true);
  }

  async function send() {
    if (lock.current) return;
    lock.current = true;
    setStatus("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          attending,
          bringAdult: going && bringAdult === "yes",
          adults: going && bringAdult === "yes" ? adults.map((n) => n.trim()) : [],
          bringKids: going && bringKids === "yes",
          kids: going && bringKids === "yes" ? kids.map((n) => n.trim()) : [],
          notes: notes.trim(),
          code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Oops, that didn’t go through. Please try again.");
        setConfirming(false);
        setStatus("idle");
        lock.current = false;
        return;
      }
      setFinalParty(data.party ?? party);
      setConfirming(false);
      setStatus("done"); // lock stays on: no second submission
    } catch {
      setError("Oops, that didn’t go through. Please try again.");
      setConfirming(false);
      setStatus("idle");
      lock.current = false;
    }
  }

  if (status === "done") {
    const first = name.trim().split(" ")[0];
    return (
      <div className="done" role="status">
        {going && <Confetti />}
        <h2>{going ? "Buckle Up, We're celebrating!" : `No worries, ${first}!`}</h2>
        <p>
          {going
            ? `Thanks, ${first}. We saved ${finalParty} ${finalParty === 1 ? "spot" : "spots"} for your crew. See you at the track!`
            : "Thanks for letting us know. We'll celebrate with you another time. Sending lots of love from Enzo!"}
        </p>
        {wished ? (
          <>
            {onOpenWall && (
              <button type="button" className="btn wish-btn" onClick={onOpenWall}>
                See the wish wall🖼️
              </button>
            )}
          </>
        ) : (
          onWrite && (
            <button type="button" className="btn wish-btn" onClick={() => onWrite(name.trim())}>
              Write a birthday wish🌠
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <>
      {heading && <h2>{heading}</h2>}
      <form className="rsvp-form" onSubmit={review} noValidate>
        {info.label && <p className="allow">Invitation for: {info.label}</p>}
        {blocked && <p className="err" role="alert">{blocked}</p>}
        {info.full && <p className="rsvp-note">The party is almost full, so new spots may no longer be available.</p>}

        <div>
          <label htmlFor="rsvp-name">Your name</label>
          <input id="rsvp-name" type="text" autoComplete="name" placeholder="Full name" maxLength={MAX_NAME_LENGTH} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <span className="legend" id="rsvp-legend">Will you be there?</span>
          <div className="choices" role="radiogroup" aria-labelledby="rsvp-legend">
            <label><input type="radio" name="att" checked={going} onChange={() => chooseAttending("yes")} /> Yes, we’ll be there</label>
            <label><input type="radio" name="att" checked={!going} onChange={() => chooseAttending("no")} /> Sorry, can’t make it</label>
          </div>
        </div>

        {going && (
          <>
            <p className="allow">Your invitation includes up to {info.maxGuests} {info.maxGuests === 1 ? "guest" : "guests"}, including you.</p>

            <div>
              <span className="legend">{info.maxAdults === 1 ? "Are you bringing one adult guest?" : `Are you bringing adult guests? (up to ${info.maxAdults})`}</span>
              <YesNo name="adult" value={bringAdult} onChange={chooseAdult} disableYes={!adultsOk} />
              {bringAdult === "yes" && (
                <NameList label="Adult guest" names={adults} setNames={setAdults} max={info.maxAdults} canAdd={room > 0} addLabel="Add another adult" />
              )}
            </div>

            <div>
              <span className="legend">Are you bringing kids?{info.maxKids > 0 ? ` (up to ${info.maxKids})` : ""}</span>
              <YesNo name="kids" value={bringKids} onChange={chooseKids} disableYes={!kidsOk} />
              {bringKids === "yes" && (
                <NameList label="Child" names={kids} setNames={setKids} max={info.maxKids} canAdd={room > 0} addLabel="Add another child" />
              )}
            </div>

            <p className="party-line">Total in your group: <b>{party}</b> of {info.maxGuests}</p>
          </>
        )}

        <div>
          <label htmlFor="rsvp-notes">Food allergies or notes (optional)</label>
          <textarea id="rsvp-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <p className="err" role="alert">{error}</p>
        <button className="btn" type="submit" disabled={status !== "idle" || !!blocked}>
          {status === "sending" ? "Sending..." : "Rev me in!"}
        </button>
      </form>

      {confirming &&
        createPortal(
          <div
            className="modal-back"
            onClick={() => { if (!lock.current) setConfirming(false); }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !lock.current) setConfirming(false);
              e.stopPropagation(); // keep arrow keys from changing slides behind the dialog
            }}
          >
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cf-title" onClick={(e) => e.stopPropagation()}>
              <h3 id="cf-title">Confirm your RSVP</h3>
              <ul className="modal-list">
                <li><b>Name:</b> {name.trim()}</li>
                {going ? (
                  <>
                    <li><b>Adult guest{adultCount > 1 ? "s" : ""}:</b> {adultCount ? adults.map((n) => n.trim()).join(", ") : "None"}</li>
                    <li><b>Kids:</b> {kidCount ? kids.map((n) => n.trim()).join(", ") : "None"}</li>
                    <li><b>Total attending:</b> {party}</li>
                  </>
                ) : (
                  <li>You’re letting us know you can’t make it.</li>
                )}
              </ul>
              <p className="modal-warn">
                {going
                  ? "Please double-check every name. Guest slots are limited, and your group will be counted right away."
                  : "Are you sure? You can send a new reply later using the same link."}
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-sm alt" disabled={status === "sending"} onClick={() => setConfirming(false)}>Go back</button>
                <button type="button" className="btn-sm" ref={confirmRef} disabled={status === "sending"} onClick={send}>
                  {status === "sending" ? "Sending..." : going ? "Yes, rev me in!" : "Yes, send it"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}