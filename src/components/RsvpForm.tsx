"use client";
import { useEffect, useState, type CSSProperties } from "react";

type Piece = { left: number; color: string; dur: number; delay: number };
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
  return (
    <>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{ left: `${p.left}vw`, background: p.color, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` } as CSSProperties}
        />
      ))}
    </>
  );
}

export default function RsvpForm() {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [count, setCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name so we know who is on the grid.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          attending,
          count: attending === "yes" ? count : 0,
          notes: notes.trim(),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
    } catch {
      setError("Oops, that didn’t go through. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    const first = name.trim().split(" ")[0];
    return (
      <div className="done" role="status">
        {attending === "yes" && <Confetti />}
        <h2>{attending === "yes" ? "You’re on the starting grid!" : `We’ll miss you, ${first}!`}</h2>
        <p>
          {attending === "yes"
            ? `Thanks, ${first}. We saved ${count} ${count === 1 ? "spot" : "spots"} for your crew. See you at the track!`
            : "Thanks for letting us know. We’ll save you a slice of cake."}
        </p>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={submit} noValidate>
      <div>
        <label htmlFor="rsvp-name">Your name</label>
        <input id="rsvp-name" type="text" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <span className="legend" id="rsvp-legend">Will you be there?</span>
        <div className="choices" role="radiogroup" aria-labelledby="rsvp-legend">
          <label><input type="radio" name="att" checked={attending === "yes"} onChange={() => setAttending("yes")} /> Yes, we’ll be there</label>
          <label><input type="radio" name="att" checked={attending === "no"} onChange={() => setAttending("no")} /> Sorry, can’t make it</label>
        </div>
      </div>

      {attending === "yes" && (
        <div>
          <label htmlFor="rsvp-count">How many racers in your group?</label>
          <select id="rsvp-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="rsvp-notes">Food allergies or notes (optional)</label>
        <textarea id="rsvp-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <p className="err" role="alert">{error}</p>
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Rev me in!"}
      </button>
    </form>
  );
}