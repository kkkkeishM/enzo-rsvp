"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_LIMITS, MAX_ATTENDANCE, MAX_NAME_LENGTH, MAX_KIDS, MIN_CHILD_AGE, MAX_CHILD_AGE, type InviteInfo } from "@/lib/limits";
import { displayNameFor } from "@/lib/christening";
import type { Godparent } from "./GodparentName";

type Piece = { left: number; color: string; dur: number; delay: number };
type Answer = "yes" | "no";
type Kid = { name: string; age: string };
const COLORS = ["#e63b2e", "#ffc928", "#1d4f91", "#ffffff", "#15161c"];
const EMPTY_KID: Kid = { name: "", age: "" };

// "y and x", "A & B", "A, B" count as one box, so we block them
const looksLikeTwoNames = (n: string) => /\b(and|or)\b|[&+/,]/i.test(n);
const stripSeparators = (v: string) => v.replace(/[&+/,]/g, "");
const ONE_NAME_MSG = "One name per box. Tap “Add another” for each person.";

const validAge = (age: string) => {
  const a = Number(age);
  return age !== "" && Number.isInteger(a) && a >= MIN_CHILD_AGE && a <= MAX_CHILD_AGE;
};

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
  const [focused, setFocused] = useState<number | null>(null);
  return (
    <div className="namelist">
      {names.map((n, i) => (
        <div className="name-row" key={i}>
          <input
            type="text"
            aria-label={`${label} ${i + 1} full name`}
            aria-invalid={looksLikeTwoNames(n) && focused !== i}
            placeholder="Name"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            value={n}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            onChange={(e) => setNames(names.map((v, j) => (j === i ? stripSeparators(e.target.value) : v)))}
          />
          {names.length > 1 && (
            <button type="button" className="rm-btn" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => setNames(names.filter((_, j) => j !== i))}>
              Remove
            </button>
          )}
        </div>
      ))}
      {names.some((n, i) => looksLikeTwoNames(n) && focused !== i) && (
        <p className="err" role="alert">{names.length < max ? ONE_NAME_MSG : "One name per box."}</p>
      )}
      {names.length < max && (
        <button type="button" className="add-btn" disabled={!canAdd} onClick={() => setNames([...names, ""])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}

function KidList({
  kids, setKids, max, canAdd,
}: {
  kids: Kid[];
  setKids: (k: Kid[]) => void;
  max: number;
  canAdd: boolean;
}) {
  const [focused, setFocused] = useState<number | null>(null);
  const update = (i: number, patch: Partial<Kid>) =>
    setKids(kids.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  return (
    <div className="namelist">
      {kids.map((k, i) => (
        <div className="name-row" key={i}>
          <input
            type="text"
            aria-label={`Child ${i + 1} full name`}
            aria-invalid={looksLikeTwoNames(k.name) && focused !== i}
            placeholder="Name"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            value={k.name}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            onChange={(e) => update(i, { name: stripSeparators(e.target.value) })}
          />
          <select
            aria-label={`Child ${i + 1} age`}
            value={k.age}
            onChange={(e) => update(i, { age: e.target.value })}
          >
            <option value="">Age</option>
            {Array.from({ length: MAX_CHILD_AGE - MIN_CHILD_AGE + 1 }, (_, n) => MIN_CHILD_AGE + n).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {kids.length > 1 && (
            <button type="button" className="rm-btn" aria-label={`Remove child ${i + 1}`} onClick={() => setKids(kids.filter((_, j) => j !== i))}>
              Remove
            </button>
          )}
        </div>
      ))}
      {kids.some((k, i) => looksLikeTwoNames(k.name) && focused !== i) && (
        <p className="err" role="alert">{kids.length < max ? ONE_NAME_MSG : "One name per box."}</p>
      )}
      {kids.length < max && (
        <button type="button" className="add-btn" disabled={!canAdd} onClick={() => setKids([...kids, { ...EMPTY_KID }])}>
          + Add another child
        </button>
      )}
      <p className="rsvp-note">Children must be {MIN_CHILD_AGE} to {MAX_CHILD_AGE} years old.</p>
    </div>
  );
}

export default function RsvpForm({
  heading, onWrite, wished, onOpenWall, godparent, alreadyRsvped, onDone,
  }: {
    heading?: string;
    onWrite?: (name: string) => void;
    wished?: boolean;
    onOpenWall?: () => void;
    godparent?: Godparent | null;
    alreadyRsvped?: boolean;
    onDone?: () => void;
  }) {
  const [attending, setAttending] = useState<Answer>("yes");
  const [bringAdult, setBringAdult] = useState<Answer>("no");
  const [adults, setAdults] = useState<string[]>([""]);
  const [bringKids, setBringKids] = useState<Answer>("no");
  const [kids, setKids] = useState<Kid[]>([{ ...EMPTY_KID }]);
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
    if (confirming) confirmRef.current?.focus({ preventScroll: true });
  }, [confirming]);

  const going = attending === "yes";
  const adultCount = going && bringAdult === "yes" ? adults.length : 0;
  const kidCount = going && bringKids === "yes" ? kids.length : 0;
  const party = going ? 1 + adultCount + kidCount : 0;
  const room = info.maxGuests - party;

  // kids are capped at MAX_KIDS even if the invitation allows more
  const kidsMax = Math.min(info.maxKids, MAX_KIDS);
  // the real ceiling for this group: you + adults + capped kids, never above the invite total
  const maxParty = Math.min(info.maxGuests, 1 + info.maxAdults + kidsMax);

  const adultsOk = info.maxAdults >= 1 && info.maxGuests - (1 + kidCount) >= 1;
  const kidsOk = kidsMax >= 1 && info.maxGuests - (1 + adultCount) >= 1;
  const name = godparent?.name ?? "";
  const who = displayNameFor(godparent);

  function chooseAttending(v: Answer) {
    setAttending(v);
    setNotes("");
    if (v === "no") {
      setBringAdult("no"); setAdults([""]);
      setBringKids("no"); setKids([{ ...EMPTY_KID }]);
    }
  }
  function chooseAdult(v: Answer) {
    setBringAdult(v);
    setAdults([""]); // switching on starts with one empty field, switching off clears them
  }
  function chooseKids(v: Answer) {
    setBringKids(v);
    setKids([{ ...EMPTY_KID }]);
  }

  function validate(): string {
    if (blocked) return blocked;
    if (!name.trim()) return "Please go back and enter your name first.";
    if (!going && !notes.trim()) return "Please tell us why you can’t make it.";
    if (!going) return "";
    if (bringAdult === "yes" && adults.some(looksLikeTwoNames)) return "Please enter one name per box. Tap “Add another adult” for each person.";
    if (bringKids === "yes" && kids.some((k) => looksLikeTwoNames(k.name))) return "Please enter one name per box. Tap “Add another child” for each child.";
    if (bringAdult === "yes" && adults.some((n) => !n.trim())) return "Enter the name of your adult guest.";
    if (bringKids === "yes" && kids.some((k) => !k.name.trim())) return "Enter the name of every child, or remove the empty fields.";
    if (bringKids === "yes" && kids.some((k) => !validAge(k.age))) return `Select an age for every child. Children must be ${MIN_CHILD_AGE} to ${MAX_CHILD_AGE} years old.`;
    if (bringKids === "yes" && kids.length > kidsMax) return `You can bring up to ${kidsMax} ${kidsMax === 1 ? "child" : "kids"}.`;
    if (party > info.maxGuests) return `Your invitation includes up to ${maxParty} guests, including you.`;
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
          title: godparent?.title ?? "",
          attending,
          bringAdult: going && bringAdult === "yes",
          adults: going && bringAdult === "yes" ? adults.map((n) => n.trim()) : [],
          bringKids: going && bringKids === "yes",
          kids: going && bringKids === "yes" ? kids.map((k) => ({ name: k.name.trim(), age: Number(k.age) })) : [],
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
      setStatus("done");
      onDone?.(); // lock stays on: no second submission
    } catch {
      setError("Oops, that didn’t go through. Please try again.");
      setConfirming(false);
      setStatus("idle");
      lock.current = false;
    }
  }

  if (alreadyRsvped && status !== "done") {
    return (
      <div className="done" role="status">
        <h2>You’re all set! 🏁</h2>
        <>
        <p>
          We've received your response.
        </p>
        <p>
          No further action is needed
        </p>
        </>
        {wished
          ? onOpenWall && <button type="button" className="btn wish-btn" onClick={onOpenWall}>See all wishes🖼️</button>
          : onWrite && <button type="button" className="btn wish-btn" onClick={() => onWrite(name.trim())}>Write a birthday wish🌠</button>}
      </div>
    );
  }

  if (status === "done") {
    const first = name.trim().split(" ")[0];
    const short = [godparent?.title, first].filter(Boolean).join(" ");
    return (
      <div className="done" role="status">
        {going && <Confetti />}
        <h2>{going ? "Buckle Up, We're celebrating!" : `No worries, ${who}! ❤️`}</h2>

        {going ? (
           <p>
           {`Thanks, ${who}. We saved ${finalParty} ${finalParty === 1 ? "spot" : "spots"} for your crew.`}
           <br />
           Can't wait to celebrate with you. See you at the track!👋🏻
         </p>
        ) : (
          <>
            <p>
              We would’ve loved to celebrate Enzo’s special day with you, but we completely understand. Thank you for letting us know!
            </p>
            <p>
              Even if you can’t make it, you can still send Enzo some love through a little birthday wish. 🌠
            </p>
          </>
        )}
        {wished ? (
          <>
            {onOpenWall && (
              <button type="button" className="btn wish-btn" onClick={onOpenWall}>
                See all wishes🖼️
              </button>
            )}
          </>
        ) : (
          onWrite && (
            <button type="button" className="btn wish-btn" onClick={() => onWrite(name.trim())}>
              {going ? "Write a birthday wish🌠" : "Leave a Birthday Wish for Enzo ♡"}
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

        {who && <p className="name-line">Hi, <b>{who}</b> ♡</p>}

        <div>
          <span className="legend" id="rsvp-legend">Will you be there?</span>
          <div className="choices" role="radiogroup" aria-labelledby="rsvp-legend">
            <label><input type="radio" name="att" checked={going} onChange={() => chooseAttending("yes")} /> Yes, we’ll be there</label>
            <label><input type="radio" name="att" checked={!going} onChange={() => chooseAttending("no")} /> Sorry, can’t make it</label>
          </div>
        </div>

        {going && (
          <>
            <p className="allow">Your invitation includes up to {maxParty} {maxParty === 1 ? "guest" : "guests"}, including you.</p>

            <div>
              <span className="legend">{info.maxAdults === 1 ? "Are you bringing one adult guest?" : `Are you bringing adult guests? (up to ${info.maxAdults})`}</span>
              <YesNo name="adult" value={bringAdult} onChange={chooseAdult} disableYes={!adultsOk} />
              {bringAdult === "yes" && (
                <NameList label="Adult guest" names={adults} setNames={setAdults} max={info.maxAdults} canAdd={room > 0} addLabel="Add another adult" />
              )}
            </div>

            <div>
              <span className="legend">Are you bringing kids?{kidsMax > 0 ? ` (up to ${kidsMax}, ages ${MIN_CHILD_AGE}–${MAX_CHILD_AGE})` : ""}</span>
              <YesNo name="kids" value={bringKids} onChange={chooseKids} disableYes={!kidsOk} />
              {bringKids === "yes" && (
                <KidList kids={kids} setKids={setKids} max={kidsMax} canAdd={room > 0} />
              )}
            </div>

            <p className="party-line">Total in your group: <b>{party}</b> of {maxParty}</p>
          </>
        )}

      <div>
        <label htmlFor="rsvp-notes">
          {going ? "Food allergies or notes (optional)" : "Reason for not attending:"}
        </label>
        <textarea
          id="rsvp-notes"
          rows={2}
          placeholder={going ? "" : "Let us know why you can’t make it"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
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
            <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cf-title" onClick={(e) => e.stopPropagation()}>
              <div className="modal-strip" aria-hidden="true" />

              <div className="modal-head">
                <span className="modal-badge" aria-hidden="true">{going ? "🏁" : "👋"}</span>
                <div>
                  <h3 id="cf-title">Confirm your RSVP</h3>
                  <p className="modal-sub">{going ? "Ready to hit the track?" : "One last check before you send"}</p>
                </div>
              </div>

              <dl className="cf-list">
                <div><dt>Name</dt><dd>{name.trim()}</dd></div>
                {going ? (
                  <>
                    <div><dt>Adult guest{adultCount > 1 ? "s" : ""}</dt><dd>{adultCount ? adults.map((n) => n.trim()).join(", ") : "None"}</dd></div>
                    <div><dt>Kids</dt><dd>{kidCount ? kids.map((k) => `${k.name.trim()} (${k.age})`).join(", ") : "None"}</dd></div>
                  </>
                ) : (
                  <>
                    <div><dt>Status</dt><dd>Can’t make it</dd></div>
                    {notes.trim() && <div><dt>Reason</dt><dd>{notes.trim()}</dd></div>}
                  </>
                )}
              </dl>

              {going && (
                <div className="cf-total">
                  <span>Total attending</span>
                  <b>{party}</b>
                </div>
              )}

              <p className="modal-warn">
                <span aria-hidden="true">⚠️</span>
                <span>
                  {going
                    ? "Please double-check every name. Guest slots are limited, and your group will be counted right away."
                    : "Are you sure? You can send a new reply later using the same link."}
                </span>
              </p>

              <div className="modal-actions">
                <button type="button" className="btn-sm alt" disabled={status === "sending"} onClick={() => setConfirming(false)}>
                  Go back
                </button>
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